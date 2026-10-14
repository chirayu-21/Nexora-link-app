import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './config/env.js'
import apiRouter from './routes/index.js'
import authRouter from './routes/v1/auth.js'
import communitiesRouter from './routes/v1/communities.js'
import connectionsRouter from './routes/v1/connections.js'
import discoveryRouter from './routes/v1/discovery.js'
import eventsRouter from './routes/v1/events.js'
import messagesRouter from './routes/v1/messages.js'
import teamsRouter from './routes/v1/teams.js'
import usersRouter from './routes/v1/users.js'
import { startEventReminderScheduler } from './lib/event-reminders.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', env.nodeEnv === 'production' ? 1 : false)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '32kb' }))
app.use(cookieParser())
app.use(morgan('dev'))

app.use('/api', apiRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/discovery', discoveryRouter)
app.use('/api/v1/events', eventsRouter)
app.use('/api/v1/connections', connectionsRouter)
app.use('/api/v1/teams', teamsRouter)
app.use('/api/v1/communities', communitiesRouter)
app.use('/api/v1/messages', messagesRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const error = err instanceof Error ? err : null
  const code = err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
    ? err.code
    : undefined
  console.error('Unhandled request error:', {
    method: _req.method,
    path: _req.path,
    name: error?.name ?? typeof err,
    code,
  })
  res.status(500).json({ error: 'internal_server_error', message: 'An unexpected error occurred. Please try again.' })
})

app.listen(env.port, () => {
  console.log(`NEXORA API running on http://localhost:${env.port}`)
  startEventReminderScheduler()
})
