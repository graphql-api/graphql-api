import { CronExpressionParser } from 'cron-parser'
import { MemoryCronStorage } from './storage'
import {
  type CronEvent,
  type CronEventType,
  type CronJob,
  type CronJobInput,
  type CronSchedulerOptions,
  type CronStorage,
  type JobExecutionContext,
  JobStatus,
  type TaskHandler,
} from './types'

export function validateCronExpression(expression: string): boolean {
  try {
    CronExpressionParser.parse(expression)
    return true
  } catch {
    return false
  }
}

export function nextCronRun(expression: string, currentDate: Date = new Date()): Date {
  return CronExpressionParser.parse(expression, { currentDate }).next().toDate()
}

function defaultId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `cron-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

export class CronScheduler {
  readonly #storage: CronStorage
  readonly #handlers = new Map<string, TaskHandler>()
  readonly #listeners = new Set<(event: CronEvent) => void>()
  readonly #running = new Set<string>()
  readonly #intervalMs: number
  readonly #maxConcurrentJobs: number
  readonly #defaultMaxRetries: number
  readonly #retryBaseDelayMs: number
  readonly #maxRetryDelayMs: number
  readonly #now: () => Date
  readonly #createId: () => string
  #timer: ReturnType<typeof setInterval> | null = null
  #ticking = false

  constructor(options: CronSchedulerOptions = {}) {
    this.#storage = options.storage ?? new MemoryCronStorage()
    this.#intervalMs = options.intervalMs ?? 1_000
    this.#maxConcurrentJobs = options.maxConcurrentJobs ?? 4
    this.#defaultMaxRetries = options.defaultMaxRetries ?? 3
    this.#retryBaseDelayMs = options.retryBaseDelayMs ?? 10_000
    this.#maxRetryDelayMs = options.maxRetryDelayMs ?? 60 * 60 * 1_000
    this.#now = options.now ?? (() => new Date())
    this.#createId = options.createId ?? defaultId
  }

  registerTask(type: string, handler: TaskHandler): () => void {
    if (!type.trim()) throw new Error('Task type must not be empty')
    this.#handlers.set(type, handler)
    return () => this.#handlers.delete(type)
  }

  start(): void {
    if (this.#timer) return
    void this.tick()
    this.#timer = setInterval(() => void this.tick(), this.#intervalMs)
  }

  stop(): void {
    if (!this.#timer) return
    clearInterval(this.#timer)
    this.#timer = null
  }

  async createJob(input: CronJobInput): Promise<CronJob> {
    this.#assertInput(input)
    const now = this.#now()
    const timestamp = now.toISOString()
    const job: CronJob = {
      id: this.#createId(),
      name: input.name.trim(),
      schedule: input.schedule.trim(),
      task: structuredClone(input.task),
      status: JobStatus.Scheduled,
      retryAttempts: 0,
      maxRetries: input.maxRetries ?? this.#defaultMaxRetries,
      tags: [...(input.tags ?? [])],
      createdAt: timestamp,
      updatedAt: timestamp,
      nextRun: nextCronRun(input.schedule, now).toISOString(),
    }
    await this.#storage.put(job)
    this.#emit('created', job)
    return job
  }

  async updateJob(id: string, input: CronJobInput): Promise<CronJob> {
    this.#assertInput(input)
    const existing = await this.#requiredJob(id)
    const now = this.#now()
    const job: CronJob = {
      ...existing,
      name: input.name.trim(),
      schedule: input.schedule.trim(),
      task: structuredClone(input.task),
      maxRetries: input.maxRetries ?? existing.maxRetries,
      tags: [...(input.tags ?? [])],
      updatedAt: now.toISOString(),
      nextRun:
        input.schedule === existing.schedule
          ? existing.nextRun
          : nextCronRun(input.schedule, now).toISOString(),
    }
    await this.#storage.put(job)
    this.#emit('updated', job)
    return job
  }

  async deleteJob(id: string): Promise<boolean> {
    const deleted = await this.#storage.delete(id)
    if (deleted) this.#emit('deleted', undefined, id)
    return deleted
  }

  async pauseJob(id: string): Promise<CronJob> {
    const existing = await this.#requiredJob(id)
    if (existing.status === JobStatus.Running) {
      throw new Error('A running job cannot be paused until its current execution completes')
    }
    const job = await this.#writeStatus(existing, JobStatus.Paused)
    this.#emit('paused', job)
    return job
  }

  async resumeJob(id: string): Promise<CronJob> {
    const existing = await this.#requiredJob(id)
    if (existing.status !== JobStatus.Paused && existing.status !== JobStatus.Failed) {
      throw new Error(`Job ${id} is not paused or failed`)
    }
    const now = this.#now()
    const job: CronJob = {
      ...existing,
      status: JobStatus.Scheduled,
      retryAttempts: 0,
      lastError: undefined,
      nextRun: nextCronRun(existing.schedule, now).toISOString(),
      updatedAt: now.toISOString(),
    }
    await this.#storage.put(job)
    this.#emit('resumed', job)
    return job
  }

  async triggerJobNow(id: string): Promise<CronJob> {
    const existing = await this.#requiredJob(id)
    if (existing.status === JobStatus.Running) throw new Error(`Job ${id} is already running`)
    const now = this.#now().toISOString()
    const job: CronJob = {
      ...existing,
      status: JobStatus.Scheduled,
      nextRun: now,
      updatedAt: now,
    }
    await this.#storage.put(job)
    this.#emit('updated', job)
    queueMicrotask(() => void this.tick())
    return job
  }

  getJob(id: string): Promise<CronJob | null> {
    return this.#storage.get(id)
  }

  getJobs(): Promise<CronJob[]> {
    return this.#storage.list()
  }

  getJobsByStatus(status: JobStatus): Promise<CronJob[]> {
    return this.#storage.listByStatus(status)
  }

  getJobsByTag(tag: string): Promise<CronJob[]> {
    return this.#storage.listByTag(tag)
  }

  on(listener: (event: CronEvent) => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  events(types?: readonly CronEventType[]): AsyncIterableIterator<CronEvent> {
    const queue: CronEvent[] = []
    let closed = false
    let pending: ((result: IteratorResult<CronEvent>) => void) | null = null
    const accepts = types ? new Set(types) : null
    const unsubscribe = this.on((event) => {
      if (accepts && !accepts.has(event.type)) return
      if (pending) {
        const resolve = pending
        pending = null
        resolve({ done: false, value: event })
        return
      }
      queue.push(event)
    })

    return {
      next: () => {
        if (closed) return Promise.resolve({ done: true, value: undefined })
        const event = queue.shift()
        if (event) return Promise.resolve({ done: false, value: event })
        return new Promise<IteratorResult<CronEvent>>((resolve) => {
          pending = resolve
        })
      },
      return: () => {
        closed = true
        unsubscribe()
        pending?.({ done: true, value: undefined })
        pending = null
        return Promise.resolve({ done: true, value: undefined })
      },
      throw: (error?: unknown) => {
        closed = true
        unsubscribe()
        pending?.({ done: true, value: undefined })
        pending = null
        return Promise.reject(error)
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }
  }

  async tick(): Promise<void> {
    if (this.#ticking) return
    this.#ticking = true
    try {
      const now = this.#now()
      const scheduled = await this.#storage.listByStatus(JobStatus.Scheduled)
      const due = scheduled
        .filter((job) => !this.#running.has(job.id) && new Date(job.nextRun) <= now)
        .sort((a, b) => a.nextRun.localeCompare(b.nextRun))
      const slots = Math.max(0, this.#maxConcurrentJobs - this.#running.size)
      await Promise.all(due.slice(0, slots).map((job) => this.#run(job)))
    } finally {
      this.#ticking = false
    }
  }

  destroy(): void {
    this.stop()
    this.#listeners.clear()
  }

  async #run(job: CronJob): Promise<void> {
    this.#running.add(job.id)
    const startedAt = this.#now()
    const running: CronJob = {
      ...job,
      status: JobStatus.Running,
      lastRun: startedAt.toISOString(),
      updatedAt: startedAt.toISOString(),
    }
    await this.#storage.put(running)
    this.#emit('started', running)

    try {
      const handler = this.#handlers.get(job.task.type)
      if (!handler) throw new Error(`No handler registered for task type "${job.task.type}"`)
      const context: JobExecutionContext = {
        jobId: job.id,
        retryCount: job.retryAttempts,
        startedAt: startedAt.toISOString(),
      }
      const result = await handler(structuredClone(job.task), context)
      const finishedAt = this.#now()
      const completed: CronJob = {
        ...running,
        status: JobStatus.Scheduled,
        retryAttempts: 0,
        lastError: undefined,
        nextRun: nextCronRun(job.schedule, finishedAt).toISOString(),
        updatedAt: finishedAt.toISOString(),
      }
      await this.#storage.put(completed)
      this.#emit('completed', completed, undefined, result)
    } catch (error) {
      const failedAt = this.#now()
      const retryAttempts = job.retryAttempts + 1
      const shouldRetry = retryAttempts <= job.maxRetries
      const delay = Math.min(
        this.#retryBaseDelayMs * 2 ** Math.max(0, retryAttempts - 1),
        this.#maxRetryDelayMs,
      )
      const failed: CronJob = {
        ...running,
        status: shouldRetry ? JobStatus.Scheduled : JobStatus.Failed,
        retryAttempts,
        nextRun: shouldRetry ? new Date(failedAt.getTime() + delay).toISOString() : running.nextRun,
        lastError: error instanceof Error ? error.message : String(error),
        updatedAt: failedAt.toISOString(),
      }
      await this.#storage.put(failed)
      this.#emit('failed', failed, undefined, undefined, failed.lastError)
    } finally {
      this.#running.delete(job.id)
    }
  }

  async #requiredJob(id: string): Promise<CronJob> {
    const job = await this.#storage.get(id)
    if (!job) throw new Error(`Job ${id} was not found`)
    return job
  }

  async #writeStatus(job: CronJob, status: JobStatus): Promise<CronJob> {
    const updated: CronJob = { ...job, status, updatedAt: this.#now().toISOString() }
    await this.#storage.put(updated)
    return updated
  }

  #assertInput(input: CronJobInput): void {
    if (!input.name.trim()) throw new Error('Job name must not be empty')
    if (!input.task.type.trim()) throw new Error('Task type must not be empty')
    if (!validateCronExpression(input.schedule)) {
      throw new Error(`Invalid cron expression: ${input.schedule}`)
    }
    if (
      input.maxRetries !== undefined &&
      (!Number.isInteger(input.maxRetries) || input.maxRetries < 0)
    ) {
      throw new Error('maxRetries must be a non-negative integer')
    }
  }

  #emit(
    type: CronEventType,
    job?: CronJob,
    explicitJobId?: string,
    result?: unknown,
    error?: string,
  ): void {
    const event: CronEvent = {
      type,
      at: this.#now().toISOString(),
      jobId: job?.id ?? explicitJobId ?? '',
      job: job ? structuredClone(job) : undefined,
      result,
      error,
    }
    for (const listener of this.#listeners) listener(event)
  }
}
