import type { NextFunction, Request, Response } from 'express'
import crypto from 'node:crypto'

import { prisma } from '../lib/prisma.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.nexora_session

  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Authentication required.' })
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const session = await prisma.session.findFirst({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    res.clearCookie('nexora_session', { path: '/' })
    return res.status(401).json({ error: 'session_expired', message: 'Your session has expired.' })
  }

  req.user = session.user
  next()
}
