import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

const teamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  hackathonName: z.string().trim().max(120).optional(),
  projectTitle: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  technologies: z.array(z.string().trim().min(1)).max(12).default([]),
  requiredRoles: z.array(z.string().trim().min(1)).max(8).default([]),
  maxTeamSize: z.coerce.number().int().min(2).max(12).default(5),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  registrationLink: z.string().trim().url().optional(),
})

router.get('/', requireAuth, async (req, res) => {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const teamList = await Promise.all(
    teams.map(async (team: any) => ({
      id: team.id,
      name: team.name,
      hackathonName: typeof team.hackathonName === 'string' ? team.hackathonName : undefined,
      projectTitle: typeof team.projectTitle === 'string' ? team.projectTitle : undefined,
      description: typeof team.description === 'string' ? team.description : undefined,
      technologies: Array.isArray(team.technologies) ? team.technologies : [],
      requiredRoles: Array.isArray(team.requiredRoles) ? team.requiredRoles : [],
      maxTeamSize: team.maxTeamSize,
      visibility: team.visibility,
      status: team.status,
      memberCount: await prisma.teamMember.count({ where: { teamId: team.id } }),
      isMember: Boolean(await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: req.user.id },
        select: { id: true },
      })),
    })),
  )

  return res.json({ success: true, data: teamList })
})

router.post('/', requireAuth, async (req, res) => {
  const parsed = teamSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() })
  }

  const payload = parsed.data
  const hackathonName = typeof payload.hackathonName === 'string' ? payload.hackathonName.trim() : undefined
  const projectTitle = typeof payload.projectTitle === 'string' ? payload.projectTitle.trim() : undefined
  const description = typeof payload.description === 'string' ? payload.description.trim() : undefined
  const registrationLink = typeof payload.registrationLink === 'string' ? payload.registrationLink.trim() : undefined
  const technologies = Array.isArray(payload.technologies)
    ? payload.technologies.map((value) => String(value).trim()).filter(Boolean)
    : []
  const requiredRoles = Array.isArray(payload.requiredRoles)
    ? payload.requiredRoles.map((value) => String(value).trim()).filter(Boolean)
    : []

  const team = await prisma.team.create({
    data: {
      name: payload.name,
      hackathonName: hackathonName || null,
      projectTitle: projectTitle || null,
      description: description || null,
      technologies,
      requiredRoles,
      maxTeamSize: payload.maxTeamSize,
      visibility: payload.visibility,
      registrationLink: registrationLink || null,
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: req.user.id,
      role: 'OWNER',
    },
  })

  return res.status(201).json({
    success: true,
    data: {
      id: team.id,
      name: team.name,
      hackathonName: typeof team.hackathonName === 'string' ? team.hackathonName : undefined,
      projectTitle: typeof team.projectTitle === 'string' ? team.projectTitle : undefined,
      description: typeof team.description === 'string' ? team.description : undefined,
      technologies: Array.isArray(team.technologies) ? team.technologies : [],
      requiredRoles: Array.isArray(team.requiredRoles) ? team.requiredRoles : [],
      maxTeamSize: team.maxTeamSize,
      visibility: team.visibility,
      status: team.status,
      memberCount: 1,
    },
  })
})

router.post('/:teamId/join', requireAuth, async (req, res) => {
  const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId
  const team = await prisma.team.findUnique({ where: { id: teamId } })

  if (!team) {
    return res.status(404).json({ error: 'team_not_found', message: 'Team not found.' })
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId: team.id, userId: req.user.id },
  })

  if (existingMember) {
    return res.status(409).json({ error: 'already_member', message: 'You are already a member of this team.' })
  }

  const memberCount = await prisma.teamMember.count({ where: { teamId: team.id } })
  if (memberCount >= team.maxTeamSize) {
    return res.status(400).json({ error: 'team_full', message: 'This team is already at capacity.' })
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: req.user.id,
      role: 'MEMBER',
    },
  })

  return res.json({ success: true, data: member })
})

export default router
