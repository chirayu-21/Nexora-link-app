import { PrismaClient } from '@prisma/client'

import { env } from '../config/env.js'
import { mockPrisma } from './mock-prisma.js'

const shouldUseMockData = env.useMockData || process.env.DATABASE_URL?.includes('localhost:5432') || process.env.DATABASE_URL?.includes('127.0.0.1:5432')

let prismaClient: PrismaClient | null = null
let useMockFallback = shouldUseMockData

if (!useMockFallback) {
  try {
    prismaClient = new PrismaClient()
    await prismaClient.$connect()
  } catch (error) {
    if (env.nodeEnv === 'production') throw error
    console.warn('Database unavailable; falling back to mock Prisma data layer in non-production.', error)
    useMockFallback = true
  }
}

export const prisma = useMockFallback ? mockPrisma : prismaClient!
