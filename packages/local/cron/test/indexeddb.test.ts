import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { IndexedDBCronStorage, JobStatus, type CronJob } from '../src'

describe('IndexedDBCronStorage', () => {
  it('persists and queries jobs by status and tag', async () => {
    const storage = new IndexedDBCronStorage(`graphql-local-cron-test-${crypto.randomUUID()}`)
    const job: CronJob = {
      id: 'job-1',
      name: 'persisted',
      schedule: '* * * * *',
      task: { type: 'SYNC', data: null },
      status: JobStatus.Scheduled,
      retryAttempts: 0,
      maxRetries: 3,
      tags: ['sync'],
      createdAt: '2026-09-23T12:00:00.000Z',
      updatedAt: '2026-09-23T12:00:00.000Z',
      nextRun: '2026-09-23T12:01:00.000Z',
    }

    await storage.put(job)

    await expect(storage.get(job.id)).resolves.toMatchObject({ id: job.id })
    await expect(storage.listByStatus(JobStatus.Scheduled)).resolves.toHaveLength(1)
    await expect(storage.listByTag('sync')).resolves.toHaveLength(1)
    await expect(storage.delete(job.id)).resolves.toBe(true)
    await expect(storage.get(job.id)).resolves.toBeNull()
  })
})
