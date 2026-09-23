import { GraphQLScalarType, Kind, type ValueNode } from 'graphql'
import { type CronScheduler, validateCronExpression } from './scheduler'
import type { CronEventType, JsonValue, JobStatus } from './types'

function parseJsonLiteral(node: ValueNode): JsonValue {
  switch (node.kind) {
    case Kind.NULL:
      return null
    case Kind.STRING:
    case Kind.ENUM:
      return node.value
    case Kind.BOOLEAN:
      return node.value
    case Kind.INT:
    case Kind.FLOAT:
      return Number(node.value)
    case Kind.LIST:
      return node.values.map(parseJsonLiteral)
    case Kind.OBJECT:
      return Object.fromEntries(node.fields.map((field) => [field.name.value, parseJsonLiteral(field.value)]))
    default:
      throw new TypeError(`Unsupported JSON literal kind: ${node.kind}`)
  }
}

function projectEvents(
  scheduler: CronScheduler,
  types: readonly CronEventType[],
  field: 'jobStatusChanged' | 'jobCompleted' | 'jobFailed',
): AsyncIterableIterator<Record<string, unknown>> {
  const source = scheduler.events(types)
  return {
    async next() {
      for (;;) {
        const result = await source.next()
        if (result.done) return { done: true, value: undefined }
        if (result.value.job) return { done: false, value: { [field]: result.value.job } }
      }
    },
    async return() {
      await source.return?.()
      return { done: true, value: undefined }
    },
    async throw(error?: unknown) {
      await source.throw?.(error)
      return Promise.reject(error)
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}

export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar Cron
  scalar JSON

  enum JobStatus {
    SCHEDULED
    RUNNING
    FAILED
    PAUSED
  }

  type TaskPayload {
    type: String!
    data: JSON!
  }

  input TaskPayloadInput {
    type: String!
    data: JSON!
  }

  type CronJob {
    id: ID!
    name: String!
    schedule: Cron!
    task: TaskPayload!
    status: JobStatus!
    retryAttempts: Int!
    maxRetries: Int!
    tags: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastRun: DateTime
    nextRun: DateTime!
    lastError: String
  }

  input CronJobInput {
    name: String!
    schedule: Cron!
    task: TaskPayloadInput!
    maxRetries: Int
    tags: [String!]
  }

  type Query {
    jobs: [CronJob!]!
    job(id: ID!): CronJob
    jobsByTag(tag: String!): [CronJob!]!
    jobsByStatus(status: JobStatus!): [CronJob!]!
  }

  type Mutation {
    createJob(input: CronJobInput!): CronJob!
    updateJob(id: ID!, input: CronJobInput!): CronJob!
    deleteJob(id: ID!): Boolean!
    pauseJob(id: ID!): CronJob!
    resumeJob(id: ID!): CronJob!
    triggerJobNow(id: ID!): CronJob!
  }

  type Subscription {
    jobStatusChanged: CronJob!
    jobCompleted: CronJob!
    jobFailed: CronJob!
  }
`

export function createResolvers(scheduler: CronScheduler) {
  const dateTime = new GraphQLScalarType({
    name: 'DateTime',
    serialize(value) {
      if (value instanceof Date) return value.toISOString()
      if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value
      throw new TypeError('DateTime must be an ISO-compatible string or Date')
    },
    parseValue(value) {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        throw new TypeError('DateTime must be an ISO-compatible string')
      }
      return value
    },
    parseLiteral(node) {
      if (node.kind !== Kind.STRING || Number.isNaN(Date.parse(node.value))) {
        throw new TypeError('DateTime must be an ISO-compatible string')
      }
      return node.value
    },
  })

  const cron = new GraphQLScalarType({
    name: 'Cron',
    serialize(value) {
      if (typeof value !== 'string') throw new TypeError('Cron must be a string')
      return value
    },
    parseValue(value) {
      if (typeof value !== 'string' || !validateCronExpression(value)) {
        throw new TypeError('Cron must be a valid cron expression')
      }
      return value
    },
    parseLiteral(node) {
      if (node.kind !== Kind.STRING || !validateCronExpression(node.value)) {
        throw new TypeError('Cron must be a valid cron expression')
      }
      return node.value
    },
  })

  const json = new GraphQLScalarType({
    name: 'JSON',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: parseJsonLiteral,
  })

  return {
    DateTime: dateTime,
    Cron: cron,
    JSON: json,
    Query: {
      jobs: () => scheduler.getJobs(),
      job: (_parent: unknown, { id }: { id: string }) => scheduler.getJob(id),
      jobsByTag: (_parent: unknown, { tag }: { tag: string }) => scheduler.getJobsByTag(tag),
      jobsByStatus: (_parent: unknown, { status }: { status: JobStatus }) =>
        scheduler.getJobsByStatus(status),
    },
    Mutation: {
      createJob: (_parent: unknown, { input }: { input: Parameters<CronScheduler['createJob']>[0] }) =>
        scheduler.createJob(input),
      updateJob: (
        _parent: unknown,
        { id, input }: { id: string; input: Parameters<CronScheduler['updateJob']>[1] },
      ) => scheduler.updateJob(id, input),
      deleteJob: (_parent: unknown, { id }: { id: string }) => scheduler.deleteJob(id),
      pauseJob: (_parent: unknown, { id }: { id: string }) => scheduler.pauseJob(id),
      resumeJob: (_parent: unknown, { id }: { id: string }) => scheduler.resumeJob(id),
      triggerJobNow: (_parent: unknown, { id }: { id: string }) => scheduler.triggerJobNow(id),
    },
    Subscription: {
      jobStatusChanged: {
        subscribe: () =>
          projectEvents(scheduler, ['created', 'updated', 'started', 'paused', 'resumed'], 'jobStatusChanged'),
      },
      jobCompleted: {
        subscribe: () => projectEvents(scheduler, ['completed'], 'jobCompleted'),
      },
      jobFailed: {
        subscribe: () => projectEvents(scheduler, ['failed'], 'jobFailed'),
      },
    },
  }
}
