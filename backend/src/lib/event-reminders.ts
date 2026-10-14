import nodemailer from 'nodemailer'

import { env } from '../config/env.js'
import { prisma } from './prisma.js'

const reminderWindowMs = 24 * 60 * 60 * 1000
const staleClaimMs = 10 * 60 * 1000
const schedulerIntervalMs = 30 * 60 * 1000

export async function sendUpcomingEventReminders(now = new Date()) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.smtpFrom) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM are required for event reminders.')
  }

  const transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPassword },
  })

  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      startDate: { gt: now, lte: new Date(now.getTime() + reminderWindowMs) },
    },
    include: {
      interests: {
        where: { status: 'INTERESTED', reminderSentAt: null },
        include: {
          user: { include: { notificationSettings: true } },
        },
      },
    },
  })

  let sent = 0
  for (const event of events) {
    for (const interest of event.interests ?? []) {
      if (!interest.user?.isEmailVerified || interest.user.notificationSettings?.eventAlerts !== true) continue

      const claimTime = new Date()
      const claim = await prisma.eventInterest.updateMany({
        where: {
          id: interest.id,
          status: 'INTERESTED',
          reminderSentAt: null,
          OR: [{ reminderClaimedAt: null }, { reminderClaimedAt: { lt: new Date(claimTime.getTime() - staleClaimMs) } }],
        },
        data: { reminderClaimedAt: claimTime },
      })
      if (claim.count !== 1) continue

      try {
        const date = event.startDate instanceof Date ? event.startDate.toLocaleString() : 'within the next 24 hours'
        await transport.sendMail({
          from: env.smtpFrom,
          to: interest.user.email,
          subject: `Upcoming event: ${event.title}`,
          text: [
            `Hello ${interest.user.fullName},`,
            '',
            `A reminder that "${event.title}" is coming up on ${date}.`,
            event.location ? `Location: ${event.location}` : '',
            event.registrationLink ? `Registration: ${event.registrationLink}` : '',
            '',
            'You received this email because you marked this event as interesting and have event email alerts enabled.',
          ].filter(Boolean).join('\n'),
        })
        await prisma.eventInterest.updateMany({
          where: { id: interest.id, reminderClaimedAt: claimTime },
          data: { reminderSentAt: new Date(), reminderClaimedAt: null },
        })
        sent++
      } catch (error) {
        await prisma.eventInterest.updateMany({
          where: { id: interest.id, reminderClaimedAt: claimTime },
          data: { reminderClaimedAt: null },
        })
        console.error('Upcoming event reminder failed.', error)
      }
    }
  }

  return sent
}

export function startEventReminderScheduler() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.smtpFrom) {
    console.warn('Event email reminders are disabled: SMTP configuration is incomplete.')
    return
  }

  const run = () => {
    void sendUpcomingEventReminders().catch((error: unknown) => {
      console.error('Upcoming event reminder scan failed.', error)
    })
  }

  run()
  const timer = setInterval(run, schedulerIntervalMs)
  timer.unref()
}
