import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

export const eventSubmissionSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional(),
  hostName: z.string().trim().max(160).optional(),
  location: z.string().trim().max(200).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  registrationDeadline: z.string().datetime().optional(),
  category: z.string().trim().max(60).optional(),
  eligibility: z.string().trim().max(300).optional(),
  registrationLink: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
})

router.get('/', requireAuth, async (req, res) => {
  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      startDate: { gt: new Date() },
    },
    orderBy: { startDate: 'asc' },
    take: 50,
  })
  const interests = await prisma.eventInterest.findMany({
    where: { userId: req.user.id, status: 'INTERESTED' },
  })
  const interestedEventIds = new Set(interests.map((interest: any) => interest.eventId))

  return res.json({
    success: true,
    data: events.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      hostName: event.hostName,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      registrationDeadline: event.registrationDeadline,
      category: event.category,
      registrationLink: event.registrationLink,
      isInterested: interestedEventIds.has(event.id),
    })),
  })
})

router.post('/', requireAuth, async (req, res) => {
  const parsed = eventSubmissionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }
  const startDate = new Date(parsed.data.startDate)
  const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined
  const deadline = parsed.data.registrationDeadline ? new Date(parsed.data.registrationDeadline) : undefined
  if (startDate <= new Date() || (endDate && endDate < startDate) || (deadline && deadline > startDate)) {
    return res.status(400).json({ error: 'invalid_dates', message: 'Check that dates are in the future and in a valid order.' })
  }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      startDate,
      endDate,
      registrationDeadline: deadline,
      status: 'PENDING_REVIEW',
      isStudentSubmitted: true,
    },
  })
  return res.status(201).json({
    success: true,
    data: { id: event.id, title: event.title, status: event.status },
    message: 'Event submitted for review. It will appear in discovery after an admin approves it.',
  })
})

router.get('/pending', requireAuth, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'forbidden', message: 'Only admins can review events.' })
  }
  const events = await prisma.event.findMany({
    where: { status: 'PENDING_REVIEW' },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  return res.json({ success: true, data: events })
})

router.post('/:eventId/review', requireAuth, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'forbidden', message: 'Only admins can review events.' })
  }
  const parsed = z.object({ action: z.enum(['PUBLISH', 'REJECT']) }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0]
  const event = await prisma.event.findFirst({ where: { id: eventId, status: 'PENDING_REVIEW' } })
  if (!event) {
    return res.status(404).json({ error: 'event_not_found', message: 'Pending event not found.' })
  }
  const status = parsed.data.action === 'PUBLISH' ? 'PUBLISHED' : 'REJECTED'
  await prisma.event.update({ where: { id: eventId }, data: { status, lastVerifiedAt: status === 'PUBLISHED' ? new Date() : null } })
  return res.json({ success: true, status })
})

router.post('/:eventId/interest', requireAuth, async (req, res) => {
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0]
  const event = await prisma.event.findFirst({
    where: { id: eventId, status: 'PUBLISHED', startDate: { gt: new Date() } },
  })

  if (!event) {
    return res.status(404).json({ error: 'event_not_found', message: 'This upcoming event is not available.' })
  }

  const existing = await prisma.eventInterest.findFirst({
    where: { userId: req.user.id, eventId },
  })

  if (existing?.status === 'INTERESTED') {
    return res.json({ success: true, isInterested: true })
  }

  if (existing) {
    await prisma.eventInterest.update({
      where: { id: existing.id },
      data: { status: 'INTERESTED', reminderSentAt: null, reminderClaimedAt: null },
    })
  } else {
    await prisma.eventInterest.create({
      data: { userId: req.user.id, eventId, status: 'INTERESTED' },
    })
  }

  return res.status(201).json({ success: true, isInterested: true })
})

router.delete('/:eventId/interest', requireAuth, async (req, res) => {
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0]
  const existing = await prisma.eventInterest.findFirst({
    where: { userId: req.user.id, eventId, status: 'INTERESTED' },
  })

  if (existing) {
    await prisma.eventInterest.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', reminderClaimedAt: null },
    })
  }

  return res.json({ success: true, isInterested: false })
})

export default router
