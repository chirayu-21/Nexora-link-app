import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { scoreStudentMatch } from '../../lib/recommendation.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

const studentQuerySchema = z.object({
  q: z.string().optional(),
  college: z.string().optional(),
  skill: z.string().optional(),
  interest: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

function sanitizeUser(user: any) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    collegeName: user.collegeName,
    degree: user.degree,
    branch: user.branch,
    academicYear: user.academicYear,
    skills: user.skills ?? [],
    interests: user.interests ?? [],
    preferredRoles: user.preferredRoles ?? [],
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    isStudentVerified: user.isStudentVerified,
    verificationLevel: user.verificationLevel,
    role: user.role,
  }
}

router.get('/students', requireAuth, async (req, res) => {
  const parsed = studentQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { q, college, skill, interest, limit } = parsed.data
  const searchTerm = q?.trim()
  const where: any = {
    id: { not: req.user.id },
    isActive: true,
  }

  if (searchTerm) {
    where.OR = [
      { fullName: { contains: searchTerm, mode: 'insensitive' } },
      { bio: { contains: searchTerm, mode: 'insensitive' } },
      { collegeName: { contains: searchTerm, mode: 'insensitive' } },
      { degree: { contains: searchTerm, mode: 'insensitive' } },
      { branch: { contains: searchTerm, mode: 'insensitive' } },
      { skills: { hasSome: [searchTerm] } },
      { interests: { hasSome: [searchTerm] } },
    ]
  }

  if (college) {
    where.collegeName = { contains: college, mode: 'insensitive' }
  }

  if (skill) {
    where.skills = { hasSome: [skill] }
  }

  if (interest) {
    where.interests = { hasSome: [interest] }
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return res.json({ success: true, data: users.map(sanitizeUser) })
})

router.get('/recommendations', requireAuth, async (req, res) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
  })

  if (!currentUser) {
    return res.status(404).json({ error: 'user_not_found', message: 'User profile not found.' })
  }

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      isActive: true,
    },
    take: 20,
  })

  const ranked = candidates
    .map((candidate: any) => {
      const match = scoreStudentMatch(currentUser, candidate)
      return {
        ...sanitizeUser(candidate),
        matchScore: match.score,
        reasons: match.reasons,
      }
    })
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, 8)

  return res.json({ success: true, data: ranked })
})

export default router
