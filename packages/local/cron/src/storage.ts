import type { CronJob, CronStorage, JobStatus } from './types'

function cloneJob(job: CronJob): CronJob {
  return structuredClone(job)
}

export class MemoryCronStorage implements CronStorage {
  readonly #jobs = new Map<string, CronJob>()

  async get(id: string): Promise<CronJob | null> {
    const job = this.#jobs.get(id)
    return job ? cloneJob(job) : null
  }

  async list(): Promise<CronJob[]> {
    return [...this.#jobs.values()].map(cloneJob)
  }

  async listByStatus(status: JobStatus): Promise<CronJob[]> {
    return [...this.#jobs.values()].filter((job) => job.status === status).map(cloneJob)
  }

  async listByTag(tag: string): Promise<CronJob[]> {
    return [...this.#jobs.values()].filter((job) => job.tags.includes(tag)).map(cloneJob)
  }

  async put(job: CronJob): Promise<void> {
    this.#jobs.set(job.id, cloneJob(job))
  }

  async delete(id: string): Promise<boolean> {
    return this.#jobs.delete(id)
  }
}
