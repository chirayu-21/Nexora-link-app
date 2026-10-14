import test from 'node:test'
import assert from 'node:assert/strict'

import { eventSubmissionSchema } from './events.js'
import { conversationSchema } from './messages.js'

test('private group chat requires a name and valid participants', () => {
  assert.equal(conversationSchema.safeParse({
    name: 'Hackathon crew',
    participantIds: ['student-2', 'student-3'],
    isGroup: true,
  }).success, true)

  assert.equal(conversationSchema.safeParse({
    participantIds: ['student-2'],
    isGroup: true,
  }).success, false)
})

test('direct chat cannot be created with multiple invited participants', () => {
  assert.equal(conversationSchema.safeParse({
    participantIds: ['student-2', 'student-3'],
    isGroup: false,
  }).success, false)
})

test('event submissions require a title and an ISO date-time', () => {
  assert.equal(eventSubmissionSchema.safeParse({
    title: 'Campus Hackathon',
    startDate: '2027-06-01T09:00:00.000Z',
  }).success, true)
  assert.equal(eventSubmissionSchema.safeParse({
    title: 'x',
    startDate: 'not-a-date',
  }).success, false)
})
