import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()
const normalizePhone = (value: string) => {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 10) digits = `91${digits}`
  else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`
  return `+${digits}`
}
const emailSchema = z.string().trim().email().max(254)
const passwordSchema = z.string().min(8).max(128)
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80), email: emailSchema,
  mobileNumber: z.string().trim().min(8).max(20).regex(/^\+?[0-9 ()-]+$/).transform(normalizePhone).refine(value => /^\+[1-9]\d{7,14}$/.test(value), 'Enter a valid phone number'),
  age: z.number().int().min(13).max(100), password: passwordSchema,
  collegeName: z.string().trim().min(2).max(160), degree: z.string().trim().max(100).optional(),
  branch: z.string().trim().max(100).optional(), academicYear: z.string().trim().max(40).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  interests: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
})
export const loginSchema = z.object({ identifier: z.string().trim().min(3).max(254), password: passwordSchema })
export const verifyOtpSchema = z.object({ identifier: z.string().trim().min(3).max(254), otp: z.string().regex(/^\d{6}$/) })
export const verifyEmailSchema = z.object({ token: z.string().min(8) })
export const forgotPasswordSchema = z.object({ email: emailSchema })
export const resetPasswordSchema = z.object({ email: emailSchema, token: z.string().min(8), password: passwordSchema })

// In-memory protection is a single-process safety net; use a shared Redis limiter in production clusters.
const attempts = new Map<string, { count: number; resetAt: number }>()
router.use((req, res, next) => {
  if (!['POST'].includes(req.method) || !['/register','/login','/verify-otp'].includes(req.path)) return next()
  const key = `${req.ip}:${req.path}`; const now = Date.now(); const current = attempts.get(key)
  if (attempts.size > 5000) for (const [entryKey, entry] of attempts) if (entry.resetAt < now) attempts.delete(entryKey)
  if (!current || current.resetAt < now) attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 })
  else if (current.count >= 12) return res.status(429).json({ error:'rate_limited', message:'Too many attempts. Please try again later.' })
  else current.count++
  next()
})
function sanitizeUser(user: any) {
  return { id:user.id, fullName:user.fullName, email:user.email, mobileNumber:user.mobileNumber, age:user.age,
    collegeName:user.collegeName, degree:user.degree, branch:user.branch, academicYear:user.academicYear,
    skills:user.skills, interests:user.interests, preferredRoles:user.preferredRoles, bio:user.bio,
    avatarUrl:user.avatarUrl, portfolioUrl:user.portfolioUrl, githubUrl:user.githubUrl, linkedinUrl:user.linkedinUrl,
    isEmailVerified:user.isEmailVerified, isStudentVerified:user.isStudentVerified,
    verificationLevel:user.verificationLevel, role:user.role, createdAt:user.createdAt, updatedAt:user.updatedAt }
}
function setSessionCookie(res: any, token: string) { res.cookie('nexora_session',token,{httpOnly:true,sameSite:env.nodeEnv==='production'?'none':'lax',secure:env.nodeEnv==='production',maxAge:7*24*60*60*1000,path:'/'}) }
function otpHash(otp: string) { return crypto.createHmac('sha256',env.sessionSecret).update(otp).digest('hex') }
function safeEqualHex(a: string, b: string) { const aa=Buffer.from(a,'hex'), bb=Buffer.from(b,'hex'); return aa.length===bb.length && crypto.timingSafeEqual(aa,bb) }
async function createSessionForUser(userId: string, req: any) {
  const sessionToken=crypto.randomBytes(32).toString('hex'); const tokenHash=crypto.createHash('sha256').update(sessionToken).digest('hex')
  const expiresAt=new Date(Date.now()+7*24*60*60*1000)
  await prisma.session.create({data:{userId,tokenHash,expiresAt,userAgent:req.headers['user-agent'] ?? null,ipAddress:req.ip ?? null}})
  return {sessionToken,expiresAt}
}
function issueOtp() { return String(crypto.randomInt(0,1_000_000)).padStart(6,'0') }
function logAuthFailure(operation: string, stage: string, error: unknown) {
  const name = error instanceof Error ? error.name : typeof error
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined
  console.error('Authentication request failed:', { operation, stage, name, code })
}
function findUserByIdentifier(identifier: string) {
  const value=identifier.trim(); const email=value.toLowerCase(); const phone=normalizePhone(value)
  return prisma.user.findFirst({where:{OR:[{email},{mobileNumber:phone}]}})
}
async function deliverOtp(user: { email: string; mobileNumber?: string | null; fullName?: string }, otp: string, purpose: 'registration' | 'login') {
  if (env.nodeEnv !== 'production') return
  if (!env.otpDeliveryUrl || !env.otpDeliveryToken) throw new Error('OTP delivery is not configured. Set OTP_DELIVERY_URL and OTP_DELIVERY_TOKEN before production use.')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(env.otpDeliveryUrl, {
      method: 'POST', signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.otpDeliveryToken}` },
      body: JSON.stringify({ email: user.email, mobileNumber: user.mobileNumber ?? null, fullName: user.fullName ?? null, otp, purpose, expiresInSeconds: 300 }),
    })
    if (!response.ok) throw new Error(`OTP delivery provider returned HTTP ${response.status}`)
  } finally { clearTimeout(timeout) }
}

router.post('/register', async (req,res,next) => {
  let stage = 'validate-registration'
  try {
    const parsed=registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({error:'validation_error',message:'Check the registration details and try again.',details:parsed.error.flatten()})
    const data=parsed.data; const email=data.email.toLowerCase(); const mobileNumber=data.mobileNumber
    stage = 'lookup-existing-account'
    const existing=await prisma.user.findFirst({where:{OR:[{email},{mobileNumber}]}})
    if (existing) return res.status(409).json({error:'account_exists',message:'An account with this email or mobile number already exists.'})
    const otp=issueOtp()
    stage = 'deliver-registration-otp'
    try { await deliverOtp({email,mobileNumber,fullName:data.fullName},otp,'registration') } catch (error) { if (env.nodeEnv==='production') return res.status(503).json({error:'otp_delivery_failed',message:'We could not send a verification code. Please try again later.'}); throw error }
    stage = 'create-user'
    let user
    try { user=await prisma.user.create({data:{fullName:data.fullName,email,mobileNumber,age:data.age,passwordHash:await bcrypt.hash(data.password,12),collegeName:data.collegeName,degree:data.degree,branch:data.branch,academicYear:data.academicYear,skills:data.skills,interests:data.interests,otpCodeHash:otpHash(otp),otpExpiresAt:new Date(Date.now()+5*60_000),otpAttempts:0,verificationLevel:'UNVERIFIED'}}) } catch (error) { if (env.nodeEnv==='production') return res.status(409).json({error:'account_exists',message:'An account with this email or mobile number already exists.'}); throw error }
    stage = 'create-default-settings'
    await prisma.userPrivacySettings.create({data:{userId:user.id,profileVisibility:'PUBLIC'}})
    await prisma.userNotificationSettings.create({data:{userId:user.id}})
    return res.status(201).json({success:true,message:'Account created. Verify the one-time code to finish registration.',otp:env.nodeEnv==='development'?otp:undefined})
  } catch (error) {
    logAuthFailure('register', stage, error)
    next(error)
  }
})

router.post('/login', async (req,res,next) => {
  let stage = 'validate-login'
  try {
    const parsed=loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({error:'validation_error',message:'Enter a valid email/mobile number and password.'})
    stage = 'lookup-account'
    const user=await findUserByIdentifier(parsed.data.identifier)
    if (!user || !user.passwordHash || !(await bcrypt.compare(parsed.data.password,user.passwordHash))) return res.status(401).json({error:'invalid_credentials',message:'Invalid email/mobile number or password.'})
    if (user.isActive === false) return res.status(403).json({error:'account_disabled',message:'This account is currently disabled.'})
    const otp=issueOtp()
    stage = 'deliver-login-otp'
    try { await deliverOtp({email:user.email,mobileNumber:user.mobileNumber,fullName:user.fullName},otp,'login') } catch (error) { if (env.nodeEnv==='production') return res.status(503).json({error:'otp_delivery_failed',message:'We could not send a verification code. Please try again later.'}); throw error }
    stage = 'save-login-otp'
    await prisma.user.update({where:{id:user.id},data:{otpCodeHash:otpHash(otp),otpExpiresAt:new Date(Date.now()+5*60_000),otpAttempts:0}})
    return res.json({success:true,message:'Password accepted. Enter the one-time code to complete login.',otp:env.nodeEnv==='development'?otp:undefined})
  } catch (error) {
    logAuthFailure('login', stage, error)
    next(error)
  }
})

router.post('/verify-otp', async (req,res) => {
  const parsed=verifyOtpSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({error:'validation_error',message:'Enter the 6-digit one-time code.'})
  const user=await findUserByIdentifier(parsed.data.identifier)
  if (!user || !user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt < new Date() || user.otpAttempts >= 5) return res.status(400).json({error:'invalid_otp',message:'The code is invalid or expired. Start again to request a new code.'})
  const valid=safeEqualHex(user.otpCodeHash,otpHash(parsed.data.otp))
  if (!valid) { await prisma.user.update({where:{id:user.id},data:{otpAttempts:{increment:1}}}); return res.status(400).json({error:'invalid_otp',message:'The code is incorrect.'}) }
  await prisma.user.update({where:{id:user.id},data:{otpCodeHash:null,otpExpiresAt:null,otpAttempts:0,isEmailVerified:true,verificationLevel:'VERIFIED_EMAIL'}})
  const {sessionToken}=await createSessionForUser(user.id,req); setSessionCookie(res,sessionToken)
  const refreshed=await prisma.user.findUnique({where:{id:user.id}})
  return res.json({success:true,user:sanitizeUser(refreshed ?? user),message:'Verification successful. Welcome to NEXORA.'})
})

router.get('/me',requireAuth,async(req,res)=>res.json({success:true,user:sanitizeUser(req.user)}))
router.post('/logout',requireAuth,async(req,res)=>{
  const token=req.cookies?.nexora_session
  if (token) await prisma.session.updateMany({where:{tokenHash:crypto.createHash('sha256').update(token).digest('hex'),revokedAt:null},data:{revokedAt:new Date()}})
  res.clearCookie('nexora_session',{path:'/',httpOnly:true,sameSite:env.nodeEnv==='production'?'none':'lax',secure:env.nodeEnv==='production'})
  return res.json({success:true,message:'Logged out successfully.'})
})

router.post('/verify-email', async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { token } = parsed.data
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: { gt: new Date() },
    },
  })

  if (!user) {
    return res.status(400).json({ error: 'invalid_token', message: 'This verification token is invalid or expired.' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationLevel: 'VERIFIED_EMAIL',
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  })

  return res.json({ success: true, message: 'Email verified successfully.' })
})

router.post('/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a recovery link has been sent.',
    })
  }

  const passwordResetToken = crypto.randomBytes(20).toString('hex')
  const passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken,
      passwordResetExpiresAt,
    },
  })

  return res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a recovery link has been sent.',
    resetToken: env.nodeEnv === 'development' ? passwordResetToken : undefined,
  })
})

router.post('/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { email, token, password } = parsed.data
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      passwordResetToken: token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  })

  if (!user) {
    return res.status(400).json({ error: 'invalid_token', message: 'This reset token is invalid or expired.' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  })

  return res.json({ success: true, message: 'Password reset successfully.' })
})

export default router
