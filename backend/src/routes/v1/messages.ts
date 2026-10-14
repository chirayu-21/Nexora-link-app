import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

export const conversationSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1).max(20),
  name: z.string().trim().min(2).max(80).optional(),
  isGroup: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.isGroup && !value.name) {
    context.addIssue({ code: 'custom', path: ['name'], message: 'A group chat name is required.' })
  }
  if (!value.isGroup && value.participantIds.length > 1) {
    context.addIssue({ code: 'custom', path: ['participantIds'], message: 'Direct chats can have only one other participant.' })
  }
})

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

async function isConversationParticipant(conversationId: string, userId: string) {
  return prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
  })
}

router.get('/conversations', requireAuth, async (req, res) => {
  const memberships = await prisma.conversationParticipant.findMany({
    where: { userId: req.user.id },
    orderBy: { joinedAt: 'desc' },
  })
  const conversations = await Promise.all(
    memberships.map((membership: any) =>
      prisma.conversation.findUnique({ where: { id: membership.conversationId } }),
    ),
  )
  const existingConversations = conversations.filter(Boolean)
  const allParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId: { in: existingConversations.map((conversation: any) => conversation.id) } },
  })
  const userIds = [...new Set(allParticipants.map((participant: any) => participant.userId))]
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } })
  const userNames = new Map(users.map((user: any) => [user.id, user.fullName]))

  const data = await Promise.all(existingConversations.map(async (conversation: any) => {
    const participants = allParticipants.filter((participant: any) => participant.conversationId === conversation.id)
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })
    return {
      id: conversation.id,
      name: conversation.name,
      isGroup: conversation.isGroup,
      communityId: conversation.communityId ?? null,
      participants: participants.map((participant: any) => ({
        id: participant.userId,
        fullName: userNames.get(participant.userId) ?? 'Student',
        role: participant.role,
      })),
      lastMessage: messages[0] ?? null,
    }
  }))

  return res.json({ success: true, data })
})

router.post('/conversations', requireAuth, async (req, res) => {
  const parsed = conversationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const participantIds = [...new Set([...parsed.data.participantIds, req.user.id])]
  if (participantIds.length < 2) {
    return res.status(400).json({ error: 'invalid_participants', message: 'A conversation needs another participant.' })
  }

  const activeUsers = await prisma.user.findMany({
    where: { id: { in: participantIds }, isActive: true },
  })
  if (activeUsers.length !== participantIds.length) {
    return res.status(400).json({ error: 'invalid_participants', message: 'One or more participants are unavailable.' })
  }

  const { name, isGroup } = parsed.data
  if (!isGroup) {
    const ownMemberships = await prisma.conversationParticipant.findMany({
      where: { userId: req.user.id },
    })
    for (const membership of ownMemberships) {
      const conversation = await prisma.conversation.findUnique({ where: { id: membership.conversationId } })
      if (!conversation || conversation.isGroup || conversation.communityId) continue
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: conversation.id },
      })
      if (participants.length === 2 && participants.some((participant: any) => participant.userId === participantIds.find((id) => id !== req.user.id))) {
        return res.status(200).json({ success: true, data: conversation, message: 'Direct conversation already exists.' })
      }
    }
  }

  const conversation = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    const createdConversation = await transaction.conversation.create({
      data: {
        name: name?.trim() || null,
        isGroup,
        createdById: req.user.id,
      },
    })
    await Promise.all(participantIds.map((participantId) =>
      transaction.conversationParticipant.create({
        data: {
          conversationId: createdConversation.id,
          userId: participantId,
          role: participantId === req.user.id ? 'ADMIN' : 'MEMBER',
        },
      }),
    ))
    return createdConversation
  })

  return res.status(201).json({
    success: true,
    data: { ...conversation, participants: participantIds.map((userId) => ({ userId })) },
  })
})

router.get('/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  const conversationId = typeof req.params.conversationId === 'string' ? req.params.conversationId : req.params.conversationId[0]
  const membership = await isConversationParticipant(conversationId, req.user.id)
  if (!membership) {
    return res.status(404).json({ error: 'conversation_not_found', message: 'Conversation not found.' })
  }

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
  return res.json({ success: true, data: messages })
})

router.post('/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  const conversationId = typeof req.params.conversationId === 'string' ? req.params.conversationId : req.params.conversationId[0]
  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const membership = await isConversationParticipant(conversationId, req.user.id)
  if (!membership) {
    return res.status(404).json({ error: 'conversation_not_found', message: 'Conversation not found.' })
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: req.user.id,
      content: parsed.data.content,
    },
  })
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })
  return res.status(201).json({ success: true, data: message })
})

export default router
