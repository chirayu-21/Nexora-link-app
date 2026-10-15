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
export const verifyEmailSchema = z.object({ token: z.string().min(8) })
export const forgotPasswordSchema = z.object({ email: emailSchema })
export const resetPasswordSchema = z.object({ email: emailSchema, token: z.string().min(8), password: passwordSchema })

// In-memory protection is a single-process safety net; use a shared Redis limiter in production clusters.
const attempts = new Map<string, { count: number; resetAt: number }>()
router.use((req, res, next) => {
  if (!['POST'].includes(req.method) || !['/register','/login'].includes(req.path)) return next()
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
async function createSessionForUser(userId: string, req: any) {
  const sessionToken=crypto.randomBytes(32).toString('hex'); const tokenHash=crypto.createHash('sha256').update(sessionToken).digest('hex')
  const expiresAt=new Date(Date.now()+7*24*60*60*1000)
  await prisma.session.create({data:{userId,tokenHash,expiresAt,userAgent:req.headers['user-agent'] ?? null,ipAddress:req.ip ?? null}})
  return {sessionToken,expiresAt}
}
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
router.post('/register', async (req,res,next) => {
  let stage = 'validate-registration'
  try {
    const parsed=registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({error:'validation_error',message:'Check the registration details and try again.',details:parsed.error.flatten()})
    const data=parsed.data; const email=data.email.toLowerCase(); const mobileNumber=data.mobileNumber
    stage = 'lookup-existing-account'
    const existing=await prisma.user.findFirst({where:{OR:[{email},{mobileNumber}]}})
    if (existing) return res.status(409).json({error:'account_exists',message:'An account with this email or mobile number already exists.'})
    stage = 'create-user'
    let user
    try { user=await prisma.user.create({data:{fullName:data.fullName,email,mobileNumber,age:data.age,passwordHash:await bcrypt.hash(data.password,12),collegeName:data.collegeName,degree:data.degree,branch:data.branch,academicYear:data.academicYear,skills:data.skills,interests:data.interests,verificationLevel:'UNVERIFIED'}}) } catch (error) { if (env.nodeEnv==='production') return res.status(409).json({error:'account_exists',message:'An account with this email or mobile number already exists.'}); throw error }
    stage = 'create-default-settings'
    await prisma.userPrivacySettings.create({data:{userId:user.id,profileVisibility:'PUBLIC'}})
    await prisma.userNotificationSettings.create({data:{userId:user.id}})
    stage = 'create-session'
    const {sessionToken}=await createSessionForUser(user.id,req)
    setSessionCookie(res,sessionToken)
    return res.status(201).json({success:true,user:sanitizeUser(user),message:'Account created successfully.'})
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
    stage = 'create-session'
    const {sessionToken}=await createSessionForUser(user.id,req)
    setSessionCookie(res,sessionToken)
    return res.json({success:true,user:sanitizeUser(user),message:'Login successful.'})
  } catch (error) {
    logAuthFailure('login', stage, error)
    next(error)
  }
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
