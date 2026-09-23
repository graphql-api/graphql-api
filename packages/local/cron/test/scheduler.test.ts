import { describe, expect, it, vi } from 'vitest'
import { CronScheduler, JobStatus, MemoryCronStorage } from '../src'

describe('CronScheduler', () => {
  it('creates a deterministic next run and executes due jobs', async () => {
    let now = new Date('2026-09-23T12:00:00.000Z')
    const storage = new MemoryCronStorage()
    const scheduler = new CronScheduler({
      storage,
      now: () => new Date(now),
      createId: () => 'job-1',
    })
    const handler = vi.fn(async () => ({ ok: true }))
    scheduler.registerTask('SYNC', handler)

    const created = await scheduler.createJob({
      name: 'sync',
      schedule: '* * * * *',
      task: { type: 'SYNC', data: { source: 'local' } },
    })

    expect(created.id).toBe('job-1')
    expect(created.nextRun).toBe('2026-09-23T12:01:00.000Z')

    now = new Date(created.nextRun)
    await scheduler.tick()

    expect(handler).toHaveBeenCalledOnce()
    const stored = await scheduler.getJob(created.id)
    expect(stored?.status).toBe(JobStatus.Scheduled)
    expect(stored?.lastRun).toBe('2026-09-23T12:01:00.000Z')
    expect(stored?.nextRun).toBe('2026-09-23T12:02:00.000Z')
  })

  it('retries with backoff and eventually marks jobs failed', async () => {
    let now = new Date('2026-09-23T12:00:00.000Z')
    const scheduler = new CronScheduler({
      now: () => new Date(now),
      createId: () => 'job-fail',
      retryBaseDelayMs: 1_000,
      maxRetryDelayMs: 1_000,
    })
    scheduler.registerTask('FAIL', () => {
      throw new Error('boom')
    })

    const job = await scheduler.createJob({
      name: 'fail',
      schedule: '* * * * *',
      task: { type: 'FAIL', data: null },
      maxRetries: 1,
    })

    now = new Date(job.nextRun)
    await scheduler.tick()
    const retry = await scheduler.getJob(job.id)
    expect(retry?.status).toBe(JobStatus.Scheduled)
    expect(retry?.retryAttempts).toBe(1)

    now = new Date(retry?.nextRun ?? '')
    await scheduler.tick()
    const failed = await scheduler.getJob(job.id)
    expect(failed?.status).toBe(JobStatus.Failed)
    expect(failed?.lastError).toBe('boom')
  })

  it('pauses and resumes jobs without hidden browser side effects', async () => {
    const scheduler = new CronScheduler({ createId: () => 'job-pause' })
    const job = await scheduler.createJob({
      name: 'pause me',
      schedule: '0 * * * *',
      task: { type: 'NOOP', data: null },
    })

    expect((await scheduler.pauseJob(job.id)).status).toBe(JobStatus.Paused)
    expect((await scheduler.resumeJob(job.id)).status).toBe(JobStatus.Scheduled)
  })

  it('rejects invalid cron expressions', async () => {
    const scheduler = new CronScheduler()
    await expect(
      scheduler.createJob({
        name: 'invalid',
        schedule: 'not a cron',
        task: { type: 'NOOP', data: null },
      }),
    ).rejects.toThrow('Invalid cron expression')
  })

  it('streams operation events through an async iterator', async () => {
    const scheduler = new CronScheduler({ createId: () => 'job-events' })
    const events = scheduler.events(['created'])
    const next = events.next()

    await scheduler.createJob({
      name: 'events',
      schedule: '* * * * *',
      task: { type: 'NOOP', data: null },
    })

    await expect(next).resolves.toMatchObject({
      done: false,
      value: { type: 'created', jobId: 'job-events' },
    })
    await events.return?.()
  })
})
