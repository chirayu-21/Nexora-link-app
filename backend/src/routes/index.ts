import { Router } from 'express'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'nexora-api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

router.get('/v1', (_req, res) => {
  res.json({
    name: 'NEXORA API',
    version: 'v1',
    status: 'operational',
  })
})

export default router
