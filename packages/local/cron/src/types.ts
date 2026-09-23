export type JsonPrimitive = boolean | number | string | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export enum JobStatus {
  Scheduled = 'SCHEDULED',
  Running = 'RUNNING',
  Failed = 'FAILED',
  Paused = 'PAUSED',
}

export interface TaskPayload {
  type: string
  data: JsonValue
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  task: TaskPayload
  status: JobStatus
  retryAttempts: number
  maxRetries: number
  tags: string[]
  createdAt: string
  updatedAt: string
  lastRun?: string
  nextRun: string
  lastError?: string
}

export interface CronJobInput {
  name: string
  schedule: string
  task: TaskPayload
  maxRetries?: number
  tags?: string[]
}

export interface JobExecutionContext {
  jobId: string
  retryCount: number
  startedAt: string
}

export type TaskHandler = (
  payload: TaskPayload,
  context: JobExecutionContext,
) => Promise<unknown> | unknown

export interface CronStorage {
  get(id: string): Promise<CronJob | null>
  list(): Promise<CronJob[]>
  listByStatus(status: JobStatus): Promise<CronJob[]>
  listByTag(tag: string): Promise<CronJob[]>
  put(job: CronJob): Promise<void>
  delete(id: string): Promise<boolean>
}

export type CronEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'started'
  | 'paused'
  | 'resumed'
  | 'completed'
  | 'failed'

export interface CronEvent {
  type: CronEventType
  at: string
  jobId: string
  job?: CronJob
  result?: unknown
  error?: string
}

export interface CronSchedulerOptions {
  storage?: CronStorage
  intervalMs?: number
  maxConcurrentJobs?: number
  defaultMaxRetries?: number
  retryBaseDelayMs?: number
  maxRetryDelayMs?: number
  now?: () => Date
  createId?: () => string
}
