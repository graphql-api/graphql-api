import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { CronJob, CronStorage, JobStatus } from './types'

interface CronDatabase extends DBSchema {
  jobs: {
    key: string
    value: CronJob
    indexes: {
      'by-next-run': string
      'by-status': JobStatus
      'by-tag': string
    }
  }
}

export class IndexedDBCronStorage implements CronStorage {
  readonly #database: Promise<IDBPDatabase<CronDatabase>>

  constructor(name = 'graphql-local-cron') {
    this.#database = openDB<CronDatabase>(name, 1, {
      upgrade(database) {
        const store = database.createObjectStore('jobs', { keyPath: 'id' })
        store.createIndex('by-status', 'status')
        store.createIndex('by-next-run', 'nextRun')
        store.createIndex('by-tag', 'tags', { multiEntry: true })
      },
    })
  }

  async get(id: string): Promise<CronJob | null> {
    return (await this.#database).get('jobs', id).then((job) => job ?? null)
  }

  async list(): Promise<CronJob[]> {
    return (await this.#database).getAll('jobs')
  }

  async listByStatus(status: JobStatus): Promise<CronJob[]> {
    return (await this.#database).getAllFromIndex('jobs', 'by-status', status)
  }

  async listByTag(tag: string): Promise<CronJob[]> {
    return (await this.#database).getAllFromIndex('jobs', 'by-tag', tag)
  }

  async put(job: CronJob): Promise<void> {
    await (await this.#database).put('jobs', job)
  }

  async delete(id: string): Promise<boolean> {
    const database = await this.#database
    const existing = await database.get('jobs', id)
    if (!existing) return false
    await database.delete('jobs', id)
    return true
  }
}
