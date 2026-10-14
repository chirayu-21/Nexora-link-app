import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

const requestSchema = z.object({
  targetUserId: z.string().min(1),
  message: z.string().max(300).optional(),
})

router.post('/request', requireAuth, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { targetUserId, message } = parsed.data

  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: 'invalid_target', message: 'You cannot send a connection request to yourself.' })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) {
    return res.status(404).json({ error: 'user_not_found', message: 'Target user was not found.' })
  }

  const existing = await prisma.connectionRequest.findFirst({
    where: {
      OR: [
        { senderId: req.user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: req.user.id },
      ],
    },
  })

  if (existing) {
    return res.status(409).json({ error: 'request_exists', message: 'A connection request already exists between these users.' })
  }

  const connectionRequest = await prisma.connectionRequest.create({
    data: {
      senderId: req.user.id,
      receiverId: targetUserId,
      message: message ?? null,
      status: 'PENDING',
    },
    include: {
      sender: true,
      receiver: true,
    },
  })

  return res.status(201).json({ success: true, data: connectionRequest })
})

router.get('/requests', requireAuth, async (req, res) => {
  const requests = await prisma.connectionRequest.findMany({
    where: {
      OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ success: true, data: requests })
})

router.post('/respond', requireAuth, async (req, res) => {
  const schema = z.object({
    requestId: z.string().min(1),
    action: z.enum(['ACCEPT', 'DECLINE']),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const { requestId, action } = parsed.data

  const request = await prisma.connectionRequest.findUnique({
    where: { id: requestId },
    include: { sender: true, receiver: true },
  })

  if (!request) {
    return res.status(404).json({ error: 'request_not_found', message: 'Connection request not found.' })
  }

  if (request.receiverId !== req.user.id) {
    return res.status(403).json({ error: 'forbidden', message: 'Only the recipient can respond to a connection request.' })
  }

  if (request.status !== 'PENDING') {
    return res.status(409).json({ error: 'already_processed', message: 'This request has already been processed.' })
  }

  const updated = await prisma.connectionRequest.update({
    where: { id: requestId },
    data: {
      status: action,
    },
  })

  return res.json({ success: true, data: updated })
})

export default router
