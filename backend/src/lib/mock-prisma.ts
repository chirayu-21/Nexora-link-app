import crypto from 'node:crypto'

const store: Record<string, any[]> = {
  user: [],
  session: [],
  connectionRequest: [],
  team: [],
  teamMember: [],
  community: [],
  communityMember: [],
  communityJoinRequest: [],
  conversation: [],
  conversationParticipant: [],
  message: [],
  event: [],
  eventInterest: [],
  userPrivacySettings: [],
  userNotificationSettings: [],
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const toArray = (value: unknown) => (Array.isArray(value) ? value : [value])

const compareScalar = (value: unknown, matcher: unknown) => {
  if (matcher && typeof matcher === 'object' && !Array.isArray(matcher)) {
    const op = matcher as Record<string, unknown>
    if ('contains' in op) return String(value ?? '').toLowerCase().includes(String(op.contains).toLowerCase())
    if ('startsWith' in op) return String(value ?? '').toLowerCase().startsWith(String(op.startsWith).toLowerCase())
    if ('in' in op) return toArray(op.in).includes(value)
    if ('not' in op) return value !== op.not
    if ('gt' in op) return Number(value) > Number(op.gt)
    if ('gte' in op) return Number(value) >= Number(op.gte)
    if ('lt' in op) return Number(value) < Number(op.lt)
    if ('lte' in op) return Number(value) <= Number(op.lte)
    if ('equals' in op) return value === op.equals
  }
  return value === matcher
}

const matchesWhere = (item: Record<string, any>, where: Record<string, any> | undefined): boolean => {
  if (!where) return true

  for (const [key, matcher] of Object.entries(where)) {
    if (key === 'AND' || key === 'OR') {
      const groups = Array.isArray(matcher) ? matcher : [matcher]
      const result = key === 'AND'
        ? groups.every((group) => matchesWhere(item, group))
        : groups.some((group) => matchesWhere(item, group))
      if (!result) return false
      continue
    }

    const current = item[key]

    if (matcher && typeof matcher === 'object' && !Array.isArray(matcher)) {
      if ('not' in matcher) {
        if (matcher.not && typeof matcher.not === 'object' && !Array.isArray(matcher.not)) {
          if (!matchesWhere(item, { [key]: matcher.not })) return false
        } else if (current === matcher.not) {
          return false
        }
        continue
      }

      if ('contains' in matcher || 'startsWith' in matcher || 'in' in matcher || 'gt' in matcher || 'gte' in matcher || 'lt' in matcher || 'lte' in matcher || 'equals' in matcher) {
        if (!compareScalar(current, matcher)) return false
        continue
      }

      if ('some' in matcher) {
        const someMatcher = matcher.some as Record<string, any>
        const list = Array.isArray(current) ? current : [current]
        if (!list.some((entry) => matchesWhere(isPlainObject(entry) ? entry : { value: entry }, someMatcher))) return false
        continue
      }

      if ('every' in matcher) {
        const everyMatcher = matcher.every as Record<string, any>
        const list = Array.isArray(current) ? current : [current]
        if (!list.every((entry) => matchesWhere(isPlainObject(entry) ? entry : { value: entry }, everyMatcher))) return false
        continue
      }

      if ('hasSome' in matcher) {
        const values = Array.isArray(current) ? current : []
        const expected = Array.isArray(matcher.hasSome) ? matcher.hasSome : [matcher.hasSome]
        if (!expected.some((expectedValue: any) => values.some((value) => String(value).toLowerCase() === String(expectedValue).toLowerCase()))) return false
        continue
      }
    }

    if (Array.isArray(matcher)) {
      if (matcher.length === 0) {
        if (current && current.length !== 0) return false
      } else if (!matcher.some((entry) => compareScalar(current, entry))) {
        return false
      }
      continue
    }

    if (current !== matcher) return false
  }

  return true
}

const sortItems = (items: any[], orderBy?: Record<string, any>) => {
  if (!orderBy) return items
  const [[field, direction]] = Object.entries(orderBy)
  const sorted = [...items]
  sorted.sort((a, b) => {
    const left = a[field]
    const right = b[field]
    if (left === right) return 0
    const factor = direction === 'asc' ? 1 : -1
    return left > right ? factor : -factor
  })
  return sorted
}

const applyInclude = (item: Record<string, any>, include: Record<string, any> | undefined) => {
  if (!include) return item
  const result = { ...item }

  for (const [relation, config] of Object.entries(include)) {
    if (relation === 'user') {
      const user = store.user.find((candidate) => candidate.id === item.userId)
      if (user) result.user = { ...user }
    }
    if (relation === 'sender' || relation === 'receiver') {
      const relationName = relation === 'sender' ? 'senderId' : 'receiverId'
      const target = store.user.find((candidate) => candidate.id === item[relationName])
      if (target) result[relation] = { ...target }
    }
    if (relation === 'participants') {
      result.participants = store.communityMember
        ? store.communityMember.filter((entry) => entry.communityId === item.id || entry.conversationId === item.id)
        : []
    }
    if (relation === 'messages') {
      const messageList = store.message.filter((entry) => entry.conversationId === item.id)
      result.messages = Array.isArray(config) ? messageList.slice(0, Number(config.length || 1)) : messageList
    }
    if (relation === 'attachments') {
      result.attachments = store.message.filter((entry) => entry.messageId === item.messageId)
    }
    if (relation === 'members') {
      if (item.teamId) {
        result.members = store.teamMember.filter((entry) => entry.teamId === item.teamId)
      } else if (item.communityId) {
        result.members = store.communityMember.filter((entry) => entry.communityId === item.communityId)
      }
    }
  }

  return result
}

const createModel = (name: string) => ({
  async findUnique({ where }: { where?: Record<string, any> } = {}) {
    return store[name].find((item) => matchesWhere(item, where)) ?? null
  },

  async findFirst({ where, include }: { where?: Record<string, any>; include?: Record<string, any> } = {}) {
    const item = store[name].find((entry) => matchesWhere(entry, where))
    return item ? applyInclude(item, include) : null
  },

  async findMany({ where, orderBy, take, include }: { where?: Record<string, any>; orderBy?: Record<string, any>; take?: number; include?: Record<string, any> } = {}) {
    const results = store[name].filter((item) => matchesWhere(item, where))
    const sorted = sortItems(results, orderBy)
    const limited = typeof take === 'number' ? sorted.slice(0, take) : sorted
    return limited.map((item) => applyInclude(item, include))
  },

  async create({ data, include }: { data?: Record<string, any>; include?: Record<string, any> } = {}) {
    const record: Record<string, any> = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }

    if (name === 'user') {
      record.isActive ??= true
      record.isEmailVerified ??= false
      record.isStudentVerified ??= false
      record.verificationLevel ??= 'UNVERIFIED'
      record.role ??= 'STUDENT'
      record.skills ??= []
      record.interests ??= []
      record.preferredRoles ??= []
    }

    if (name === 'team') {
      record.visibility ??= 'PUBLIC'
      record.status ??= 'OPEN'
      record.technologies ??= []
      record.requiredRoles ??= []
      record.maxTeamSize ??= 5
    }

    if (name === 'community') {
      record.visibility ??= 'PUBLIC'
      record.membershipPolicy ??= 'OPEN'
    }

    if (name === 'conversation') {
      record.isGroup ??= false
    }

    if (name === 'message') {
      record.deletedAt ??= null
    }

    if (name === 'userNotificationSettings') {
      record.emailNotifications ??= true
      record.messageAlerts ??= true
      record.teamAlerts ??= true
      record.communityAlerts ??= true
      record.eventAlerts ??= true
    }

    if (name === 'user') {
      if (record.email && store.user.some((entry) => entry.email === record.email)) throw new Error('Unique constraint failed on email')
      if (record.mobileNumber && store.user.some((entry) => entry.mobileNumber === record.mobileNumber)) throw new Error('Unique constraint failed on mobileNumber')
    }
    store[name].push(record)
    return applyInclude(record, include)
  },

  async update({ where, data }: { where?: Record<string, any>; data?: Record<string, any> } = {}) {
    const index = store[name].findIndex((item) => matchesWhere(item, where))
    if (index === -1) throw new Error(`Mock ${name} not found`)
    const next = { ...store[name][index], ...data, updatedAt: new Date() }
    for (const [field, value] of Object.entries(data ?? {})) {
      if (isPlainObject(value) && 'increment' in value) next[field] = Number(store[name][index][field] ?? 0) + Number(value.increment)
    }
    store[name][index] = next
    return next
  },

  async updateMany({ where, data }: { where?: Record<string, any>; data?: Record<string, any> } = {}) {
    let count = 0
    store[name] = store[name].map((item) => {
      if (!matchesWhere(item, where)) return item
      count++
      const next = { ...item, ...data, updatedAt: new Date() }
      for (const [field, value] of Object.entries(data ?? {})) if (isPlainObject(value) && 'increment' in value) next[field] = Number(item[field] ?? 0) + Number(value.increment)
      return next
    })
    return { count }
  },
  async deleteMany({ where }: { where?: Record<string, any> } = {}) {
    const previous = store[name]
    store[name] = previous.filter((item) => !matchesWhere(item, where))
    return { count: previous.length - store[name].length }
  },
  async count({ where }: { where?: Record<string, any> } = {}) {
    return store[name].filter((item) => matchesWhere(item, where)).length
  },
})

export const mockPrisma = new Proxy(
  {} as Record<string, any>,
  {
    get: (_target, modelName) => {
      if (typeof modelName !== 'string') return undefined
      if (modelName === '$transaction') {
        return async (operation: (client: typeof mockPrisma) => Promise<unknown>) => {
          const snapshot = Object.fromEntries(
            Object.entries(store).map(([key, records]) => [key, records.map((record) => ({ ...record }))]),
          )
          try {
            return await operation(mockPrisma)
          } catch (error) {
            for (const key of Object.keys(store)) delete store[key]
            Object.assign(store, snapshot)
            throw error
          }
        }
      }
      if (!(modelName in store)) {
        store[modelName] = []
      }
      return createModel(modelName)
    },
  },
)
