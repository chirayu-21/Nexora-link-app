import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

const communitySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().max(60).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  membershipPolicy: z.enum(['OPEN', 'APPROVAL_REQUIRED']).default('OPEN'),
})

router.get('/', requireAuth, async (req, res) => {
  const communities = await prisma.community.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const memberships = await prisma.communityMember.findMany({ where: { userId: req.user.id } })
  const membershipByCommunity = new Map<string, (typeof memberships)[number]>(
    memberships.map((membership: any) => [membership.communityId, membership] as const),
  )
  const visibleCommunities = communities.filter((community: any) =>
    community.visibility === 'PUBLIC' || membershipByCommunity.has(community.id),
  )
  const communityList = await Promise.all(visibleCommunities.map(async (community: any) => {
    const membership = membershipByCommunity.get(community.id)
    const chat = membership
      ? await prisma.conversation.findFirst({ where: { communityId: community.id } })
      : null
    return {
      id: community.id,
      name: community.name,
      description: typeof community.description === 'string' ? community.description : undefined,
      category: typeof community.category === 'string' ? community.category : undefined,
      visibility: community.visibility,
      membershipPolicy: community.membershipPolicy,
      memberCount: await prisma.communityMember.count({ where: { communityId: community.id } }),
      isMember: Boolean(membership),
      isAdmin: membership?.role === 'ADMIN',
      chatConversationId: chat?.id,
    }
  }))

  return res.json({ success: true, data: communityList })
})

router.post('/', requireAuth, async (req, res) => {
  const parsed = communitySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const payload = parsed.data
  const { community, chat } = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    const createdCommunity = await transaction.community.create({
      data: {
        name: payload.name,
        description: payload.description?.trim() || null,
        category: payload.category?.trim() || null,
        visibility: payload.visibility,
        membershipPolicy: payload.membershipPolicy,
      },
    })
    const createdChat = await transaction.conversation.create({
      data: { name: `${createdCommunity.name} Club`, isGroup: true, createdById: req.user.id, communityId: createdCommunity.id },
    })
    await transaction.communityMember.create({
      data: { communityId: createdCommunity.id, userId: req.user.id, role: 'ADMIN' },
    })
    await transaction.conversationParticipant.create({
      data: { conversationId: createdChat.id, userId: req.user.id, role: 'ADMIN' },
    })
    return { community: createdCommunity, chat: createdChat }
  })

  return res.status(201).json({
    success: true,
    data: {
      id: community.id,
      name: community.name,
      description: community.description,
      category: community.category,
      visibility: community.visibility,
      membershipPolicy: community.membershipPolicy,
      memberCount: 1,
      isMember: true,
      isAdmin: true,
      chatConversationId: chat.id,
    },
  })
})

router.post('/:communityId/join', requireAuth, async (req, res) => {
  const communityId = typeof req.params.communityId === 'string' ? req.params.communityId : req.params.communityId[0]
  const community = await prisma.community.findUnique({ where: { id: communityId } })
  if (!community) {
    return res.status(404).json({ error: 'community_not_found', message: 'Community not found.' })
  }

  const existingMember = await prisma.communityMember.findFirst({
    where: { communityId, userId: req.user.id },
  })
  if (existingMember) {
    return res.status(409).json({ error: 'already_member', message: 'You are already a member of this community.' })
  }
  if (community.visibility === 'PRIVATE') {
    return res.status(404).json({ error: 'community_not_found', message: 'Community not found.' })
  }

  if (community.membershipPolicy === 'APPROVAL_REQUIRED') {
    const existingRequest = await prisma.communityJoinRequest.findFirst({
      where: { communityId, userId: req.user.id, status: 'PENDING' },
    })
    if (existingRequest) {
      return res.status(202).json({ success: true, status: 'PENDING', message: 'Your membership request is awaiting approval.' })
    }
    const request = await prisma.communityJoinRequest.create({
      data: { communityId, userId: req.user.id, status: 'PENDING' },
    })
    return res.status(202).json({ success: true, status: request.status, message: 'Your membership request was sent to the club admins.' })
  }

  const chat = await prisma.conversation.findFirst({ where: { communityId } })
  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await transaction.communityMember.create({
      data: { communityId, userId: req.user.id, role: 'MEMBER' },
    })
    if (chat) {
      await transaction.conversationParticipant.create({
        data: { conversationId: chat.id, userId: req.user.id, role: 'MEMBER' },
      })
    }
  })
  return res.status(201).json({ success: true, status: 'JOINED', message: 'You joined the club and its private chat.' })
})

router.post('/:communityId/invite', requireAuth, async (req, res) => {
  const communityId = typeof req.params.communityId === 'string' ? req.params.communityId : req.params.communityId[0]
  const parsed = z.object({ userIds: z.array(z.string().min(1)).min(1).max(20) }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }
  const admin = await prisma.communityMember.findFirst({
    where: { communityId, userId: req.user.id, role: 'ADMIN' },
  })
  if (!admin) {
    return res.status(403).json({ error: 'forbidden', message: 'Only club admins can invite members.' })
  }
  const community = await prisma.community.findUnique({ where: { id: communityId } })
  if (!community) {
    return res.status(404).json({ error: 'community_not_found', message: 'Community not found.' })
  }
  const userIds = [...new Set(parsed.data.userIds)].filter((userId) => userId !== req.user.id)
  const users = await prisma.user.findMany({ where: { id: { in: userIds }, isActive: true } })
  if (users.length !== userIds.length) {
    return res.status(400).json({ error: 'invalid_members', message: 'One or more invited students are unavailable.' })
  }
  const chat = await prisma.conversation.findFirst({ where: { communityId } })
  const memberships = await prisma.communityMember.findMany({
    where: { communityId, userId: { in: userIds } },
  })
  const existingIds = new Set(memberships.map((membership: any) => membership.userId))
  const newMemberIds = userIds.filter((userId) => !existingIds.has(userId))
  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    for (const userId of newMemberIds) {
      await transaction.communityMember.create({ data: { communityId, userId, role: 'MEMBER' } })
      if (chat) {
        await transaction.conversationParticipant.create({
          data: { conversationId: chat.id, userId, role: 'MEMBER' },
        })
      }
      const pendingRequest = await transaction.communityJoinRequest.findFirst({
        where: { communityId, userId, status: 'PENDING' },
      })
      if (pendingRequest) {
        await transaction.communityJoinRequest.update({
          where: { id: pendingRequest.id },
          data: { status: 'APPROVED' },
        })
      }
    }
  })
  const added = newMemberIds.length
  return res.json({ success: true, added })
})

router.post('/:communityId/leave', requireAuth, async (req, res) => {
  const communityId = typeof req.params.communityId === 'string' ? req.params.communityId : req.params.communityId[0]
  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId: req.user.id },
  })
  if (!membership) {
    return res.status(404).json({ error: 'membership_not_found', message: 'You are not a member of this club.' })
  }
  if (membership.role === 'ADMIN') {
    const admins = await prisma.communityMember.findMany({ where: { communityId, role: 'ADMIN' } })
    if (admins.length <= 1) {
      return res.status(409).json({ error: 'last_admin', message: 'Promote another club admin before leaving.' })
    }
  }
  const chat = await prisma.conversation.findFirst({ where: { communityId } })
  await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await transaction.communityMember.deleteMany({ where: { communityId, userId: req.user.id } })
    if (chat) {
      await transaction.conversationParticipant.deleteMany({
        where: { conversationId: chat.id, userId: req.user.id },
      })
    }
  })
  return res.json({ success: true, message: 'You left the club and its private chat.' })
})

router.get('/:communityId/requests', requireAuth, async (req, res) => {
  const communityId = typeof req.params.communityId === 'string' ? req.params.communityId : req.params.communityId[0]
  const admin = await prisma.communityMember.findFirst({
    where: { communityId, userId: req.user.id, role: 'ADMIN' },
  })
  if (!admin) {
    return res.status(403).json({ error: 'forbidden', message: 'Only club admins can view membership requests.' })
  }
  const requests = await prisma.communityJoinRequest.findMany({
    where: { communityId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })
  const users = await prisma.user.findMany({
    where: { id: { in: requests.map((request: any) => request.userId) } },
  })
  const userNames = new Map(users.map((user: any) => [user.id, user.fullName]))
  return res.json({
    success: true,
    data: requests.map((request: any) => ({
      id: request.id,
      userId: request.userId,
      fullName: userNames.get(request.userId) ?? 'Student',
      createdAt: request.createdAt,
    })),
  })
})

router.post('/:communityId/requests/:requestId', requireAuth, async (req, res) => {
  const communityId = typeof req.params.communityId === 'string' ? req.params.communityId : req.params.communityId[0]
  const requestId = typeof req.params.requestId === 'string' ? req.params.requestId : req.params.requestId[0]
  const parsed = z.object({ action: z.enum(['APPROVE', 'DECLINE']) }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }
  const admin = await prisma.communityMember.findFirst({
    where: { communityId, userId: req.user.id, role: 'ADMIN' },
  })
  if (!admin) {
    return res.status(403).json({ error: 'forbidden', message: 'Only club admins can process membership requests.' })
  }
  const request = await prisma.communityJoinRequest.findFirst({
    where: { id: requestId, communityId, status: 'PENDING' },
  })
  if (!request) {
    return res.status(404).json({ error: 'request_not_found', message: 'Pending membership request not found.' })
  }

  const approved = parsed.data.action === 'APPROVE'
  if (approved) {
    const chat = await prisma.conversation.findFirst({ where: { communityId } })
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.communityMember.create({
        data: { communityId, userId: request.userId, role: 'MEMBER' },
      })
      if (chat) {
        await transaction.conversationParticipant.create({
          data: { conversationId: chat.id, userId: request.userId, role: 'MEMBER' },
        })
      }
      await transaction.communityJoinRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED' },
      })
    })
  } else {
    await prisma.communityJoinRequest.update({
      where: { id: request.id },
      data: { status: 'DECLINED' },
    })
  }
  return res.json({ success: true, status: approved ? 'APPROVED' : 'DECLINED' })
})

export default router
