import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

const onboardingSchema = z.object({
  skills: z.array(z.string().trim()).optional(),
  interests: z.array(z.string().trim()).optional(),
  preferredRoles: z.array(z.string().trim()).optional(),
  bio: z.string().trim().max(280).optional(),
  collegeName: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  portfolioUrl: z.string().trim().url().optional().or(z.literal('')),
  githubUrl: z.string().trim().url().optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobileNumber: true,
      age: true,
      collegeName: true,
      degree: true,
      branch: true,
      academicYear: true,
      skills: true,
      interests: true,
      preferredRoles: true,
      bio: true,
      avatarUrl: true,
      portfolioUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      isEmailVerified: true,
      isStudentVerified: true,
      verificationLevel: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!user) {
    return res.status(404).json({ error: 'user_not_found', message: 'User profile not found.' })
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      age: user.age,
      collegeName: user.collegeName,
      degree: user.degree,
      branch: user.branch,
      academicYear: user.academicYear,
      skills: user.skills,
      interests: user.interests,
      preferredRoles: user.preferredRoles,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      portfolioUrl: user.portfolioUrl,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      isEmailVerified: user.isEmailVerified,
      isStudentVerified: user.isStudentVerified,
      verificationLevel: user.verificationLevel,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  })
})

router.get('/me/notifications', requireAuth, async (req, res) => {
  let settings = await prisma.userNotificationSettings.findUnique({
    where: { userId: req.user!.id },
  })
  if (!settings) {
    settings = await prisma.userNotificationSettings.create({
      data: { userId: req.user!.id },
    })
  }
  return res.json({ success: true, settings })
})

router.put('/me/notifications', requireAuth, async (req, res) => {
  const schema = z.object({
    emailNotifications: z.boolean().optional(),
    messageAlerts: z.boolean().optional(),
    teamAlerts: z.boolean().optional(),
    communityAlerts: z.boolean().optional(),
    eventAlerts: z.boolean().optional(),
  }).strict().refine((settings) => Object.keys(settings).length > 0, 'Provide at least one notification preference.')
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const existing = await prisma.userNotificationSettings.findUnique({
    where: { userId: req.user!.id },
  })
  const settings = existing
    ? await prisma.userNotificationSettings.update({
        where: { userId: req.user!.id },
        data: parsed.data,
      })
    : await prisma.userNotificationSettings.create({
        data: { userId: req.user!.id, ...parsed.data },
      })

  return res.json({ success: true, settings })
})

router.put('/me/onboarding', requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const updates = parsed.data
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...updates,
      bio: updates.bio ?? undefined,
      portfolioUrl: updates.portfolioUrl || undefined,
      githubUrl: updates.githubUrl || undefined,
      linkedinUrl: updates.linkedinUrl || undefined,
    },
  })

  return res.json({ success: true, user: { ...user, passwordHash: undefined } })
})

export default router
