import { GraphQLScalarType, Kind } from "graphql";
import { CronExpressionParser } from "cron-parser";
import { openDB } from "idb";
//#region src/storage.ts
function cloneJob(job) {
	return structuredClone(job);
}
var MemoryCronStorage = class {
	#jobs = /* @__PURE__ */ new Map();
	async get(id) {
		const job = this.#jobs.get(id);
		return job ? cloneJob(job) : null;
	}
	async list() {
		return [...this.#jobs.values()].map(cloneJob);
	}
	async listByStatus(status) {
		return [...this.#jobs.values()].filter((job) => job.status === status).map(cloneJob);
	}
	async listByTag(tag) {
		return [...this.#jobs.values()].filter((job) => job.tags.includes(tag)).map(cloneJob);
	}
	async put(job) {
		this.#jobs.set(job.id, cloneJob(job));
	}
	async delete(id) {
		return this.#jobs.delete(id);
	}
};
//#endregion
//#region src/types.ts
let JobStatus = /* @__PURE__ */ function(JobStatus) {
	JobStatus["Scheduled"] = "SCHEDULED";
	JobStatus["Running"] = "RUNNING";
	JobStatus["Failed"] = "FAILED";
	JobStatus["Paused"] = "PAUSED";
	return JobStatus;
}({});
//#endregion
//#region src/scheduler.ts
function validateCronExpression(expression) {
	try {
		CronExpressionParser.parse(expression);
		return true;
	} catch {
		return false;
	}
}
function nextCronRun(expression, currentDate = /* @__PURE__ */ new Date()) {
	return CronExpressionParser.parse(expression, { currentDate }).next().toDate();
}
function defaultId() {
	return globalThis.crypto?.randomUUID?.() ?? `cron-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
var CronScheduler = class {
	#storage;
	#handlers = /* @__PURE__ */ new Map();
	#listeners = /* @__PURE__ */ new Set();
	#running = /* @__PURE__ */ new Set();
	#intervalMs;
	#maxConcurrentJobs;
	#defaultMaxRetries;
	#retryBaseDelayMs;
	#maxRetryDelayMs;
	#now;
	#createId;
	#timer = null;
	#ticking = false;
	constructor(options = {}) {
		this.#storage = options.storage ?? new MemoryCronStorage();
		this.#intervalMs = options.intervalMs ?? 1e3;
		this.#maxConcurrentJobs = options.maxConcurrentJobs ?? 4;
		this.#defaultMaxRetries = options.defaultMaxRetries ?? 3;
		this.#retryBaseDelayMs = options.retryBaseDelayMs ?? 1e4;
		this.#maxRetryDelayMs = options.maxRetryDelayMs ?? 36e5;
		this.#now = options.now ?? (() => /* @__PURE__ */ new Date());
		this.#createId = options.createId ?? defaultId;
	}
	registerTask(type, handler) {
		if (!type.trim()) throw new Error("Task type must not be empty");
		this.#handlers.set(type, handler);
		return () => this.#handlers.delete(type);
	}
	start() {
		if (this.#timer) return;
		this.tick();
		this.#timer = setInterval(() => void this.tick(), this.#intervalMs);
	}
	stop() {
		if (!this.#timer) return;
		clearInterval(this.#timer);
		this.#timer = null;
	}
	async createJob(input) {
		this.#assertInput(input);
		const now = this.#now();
		const timestamp = now.toISOString();
		const job = {
			id: this.#createId(),
			name: input.name.trim(),
			schedule: input.schedule.trim(),
			task: structuredClone(input.task),
			status: "SCHEDULED",
			retryAttempts: 0,
			maxRetries: input.maxRetries ?? this.#defaultMaxRetries,
			tags: [...input.tags ?? []],
			createdAt: timestamp,
			updatedAt: timestamp,
			nextRun: nextCronRun(input.schedule, now).toISOString()
		};
		await this.#storage.put(job);
		this.#emit("created", job);
		return job;
	}
	async updateJob(id, input) {
		this.#assertInput(input);
		const existing = await this.#requiredJob(id);
		const now = this.#now();
		const job = {
			...existing,
			name: input.name.trim(),
			schedule: input.schedule.trim(),
			task: structuredClone(input.task),
			maxRetries: input.maxRetries ?? existing.maxRetries,
			tags: [...input.tags ?? []],
			updatedAt: now.toISOString(),
			nextRun: input.schedule === existing.schedule ? existing.nextRun : nextCronRun(input.schedule, now).toISOString()
		};
		await this.#storage.put(job);
		this.#emit("updated", job);
		return job;
	}
	async deleteJob(id) {
		const deleted = await this.#storage.delete(id);
		if (deleted) this.#emit("deleted", void 0, id);
		return deleted;
	}
	async pauseJob(id) {
		const existing = await this.#requiredJob(id);
		if (existing.status === "RUNNING") throw new Error("A running job cannot be paused until its current execution completes");
		const job = await this.#writeStatus(existing, "PAUSED");
		this.#emit("paused", job);
		return job;
	}
	async resumeJob(id) {
		const existing = await this.#requiredJob(id);
		if (existing.status !== "PAUSED" && existing.status !== "FAILED") throw new Error(`Job ${id} is not paused or failed`);
		const now = this.#now();
		const job = {
			...existing,
			status: "SCHEDULED",
			retryAttempts: 0,
			lastError: void 0,
			nextRun: nextCronRun(existing.schedule, now).toISOString(),
			updatedAt: now.toISOString()
		};
		await this.#storage.put(job);
		this.#emit("resumed", job);
		return job;
	}
	async triggerJobNow(id) {
		const existing = await this.#requiredJob(id);
		if (existing.status === "RUNNING") throw new Error(`Job ${id} is already running`);
		const now = this.#now().toISOString();
		const job = {
			...existing,
			status: "SCHEDULED",
			nextRun: now,
			updatedAt: now
		};
		await this.#storage.put(job);
		this.#emit("updated", job);
		queueMicrotask(() => void this.tick());
		return job;
	}
	getJob(id) {
		return this.#storage.get(id);
	}
	getJobs() {
		return this.#storage.list();
	}
	getJobsByStatus(status) {
		return this.#storage.listByStatus(status);
	}
	getJobsByTag(tag) {
		return this.#storage.listByTag(tag);
	}
	on(listener) {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}
	events(types) {
		const queue = [];
		let closed = false;
		let pending = null;
		const accepts = types ? new Set(types) : null;
		const unsubscribe = this.on((event) => {
			if (accepts && !accepts.has(event.type)) return;
			if (pending) {
				const resolve = pending;
				pending = null;
				resolve({
					done: false,
					value: event
				});
				return;
			}
			queue.push(event);
		});
		return {
			next: () => {
				if (closed) return Promise.resolve({
					done: true,
					value: void 0
				});
				const event = queue.shift();
				if (event) return Promise.resolve({
					done: false,
					value: event
				});
				return new Promise((resolve) => {
					pending = resolve;
				});
			},
			return: () => {
				closed = true;
				unsubscribe();
				pending?.({
					done: true,
					value: void 0
				});
				pending = null;
				return Promise.resolve({
					done: true,
					value: void 0
				});
			},
			throw: (error) => {
				closed = true;
				unsubscribe();
				pending?.({
					done: true,
					value: void 0
				});
				pending = null;
				return Promise.reject(error);
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
	async tick() {
		if (this.#ticking) return;
		this.#ticking = true;
		try {
			const now = this.#now();
			const due = (await this.#storage.listByStatus("SCHEDULED")).filter((job) => !this.#running.has(job.id) && new Date(job.nextRun) <= now).sort((a, b) => a.nextRun.localeCompare(b.nextRun));
			const slots = Math.max(0, this.#maxConcurrentJobs - this.#running.size);
			await Promise.all(due.slice(0, slots).map((job) => this.#run(job)));
		} finally {
			this.#ticking = false;
		}
	}
	destroy() {
		this.stop();
		this.#listeners.clear();
	}
	async #run(job) {
		this.#running.add(job.id);
		const startedAt = this.#now();
		const running = {
			...job,
			status: "RUNNING",
			lastRun: startedAt.toISOString(),
			updatedAt: startedAt.toISOString()
		};
		await this.#storage.put(running);
		this.#emit("started", running);
		try {
			const handler = this.#handlers.get(job.task.type);
			if (!handler) throw new Error(`No handler registered for task type "${job.task.type}"`);
			const context = {
				jobId: job.id,
				retryCount: job.retryAttempts,
				startedAt: startedAt.toISOString()
			};
			const result = await handler(structuredClone(job.task), context);
			const finishedAt = this.#now();
			const completed = {
				...running,
				status: "SCHEDULED",
				retryAttempts: 0,
				lastError: void 0,
				nextRun: nextCronRun(job.schedule, finishedAt).toISOString(),
				updatedAt: finishedAt.toISOString()
			};
			await this.#storage.put(completed);
			this.#emit("completed", completed, void 0, result);
		} catch (error) {
			const failedAt = this.#now();
			const retryAttempts = job.retryAttempts + 1;
			const shouldRetry = retryAttempts <= job.maxRetries;
			const delay = Math.min(this.#retryBaseDelayMs * 2 ** Math.max(0, retryAttempts - 1), this.#maxRetryDelayMs);
			const failed = {
				...running,
				status: shouldRetry ? "SCHEDULED" : "FAILED",
				retryAttempts,
				nextRun: shouldRetry ? new Date(failedAt.getTime() + delay).toISOString() : running.nextRun,
				lastError: error instanceof Error ? error.message : String(error),
				updatedAt: failedAt.toISOString()
			};
			await this.#storage.put(failed);
			this.#emit("failed", failed, void 0, void 0, failed.lastError);
		} finally {
			this.#running.delete(job.id);
		}
	}
	async #requiredJob(id) {
		const job = await this.#storage.get(id);
		if (!job) throw new Error(`Job ${id} was not found`);
		return job;
	}
	async #writeStatus(job, status) {
		const updated = {
			...job,
			status,
			updatedAt: this.#now().toISOString()
		};
		await this.#storage.put(updated);
		return updated;
	}
	#assertInput(input) {
		if (!input.name.trim()) throw new Error("Job name must not be empty");
		if (!input.task.type.trim()) throw new Error("Task type must not be empty");
		if (!validateCronExpression(input.schedule)) throw new Error(`Invalid cron expression: ${input.schedule}`);
		if (input.maxRetries !== void 0 && (!Number.isInteger(input.maxRetries) || input.maxRetries < 0)) throw new Error("maxRetries must be a non-negative integer");
	}
	#emit(type, job, explicitJobId, result, error) {
		const event = {
			type,
			at: this.#now().toISOString(),
			jobId: job?.id ?? explicitJobId ?? "",
			job: job ? structuredClone(job) : void 0,
			result,
			error
		};
		for (const listener of this.#listeners) listener(event);
	}
};
//#endregion
//#region src/graphql.ts
function parseJsonLiteral(node) {
	switch (node.kind) {
		case Kind.NULL: return null;
		case Kind.STRING:
		case Kind.ENUM: return node.value;
		case Kind.BOOLEAN: return node.value;
		case Kind.INT:
		case Kind.FLOAT: return Number(node.value);
		case Kind.LIST: return node.values.map(parseJsonLiteral);
		case Kind.OBJECT: return Object.fromEntries(node.fields.map((field) => [field.name.value, parseJsonLiteral(field.value)]));
		default: throw new TypeError(`Unsupported JSON literal kind: ${node.kind}`);
	}
}
function projectEvents(scheduler, types, field) {
	const source = scheduler.events(types);
	return {
		async next() {
			for (;;) {
				const result = await source.next();
				if (result.done) return {
					done: true,
					value: void 0
				};
				if (result.value.job) return {
					done: false,
					value: { [field]: result.value.job }
				};
			}
		},
		async return() {
			await source.return?.();
			return {
				done: true,
				value: void 0
			};
		},
		async throw(error) {
			await source.throw?.(error);
			return Promise.reject(error);
		},
		[Symbol.asyncIterator]() {
			return this;
		}
	};
}
const typeDefs = `
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
`;
function createResolvers(scheduler) {
	return {
		DateTime: new GraphQLScalarType({
			name: "DateTime",
			serialize(value) {
				if (value instanceof Date) return value.toISOString();
				if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
				throw new TypeError("DateTime must be an ISO-compatible string or Date");
			},
			parseValue(value) {
				if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError("DateTime must be an ISO-compatible string");
				return value;
			},
			parseLiteral(node) {
				if (node.kind !== Kind.STRING || Number.isNaN(Date.parse(node.value))) throw new TypeError("DateTime must be an ISO-compatible string");
				return node.value;
			}
		}),
		Cron: new GraphQLScalarType({
			name: "Cron",
			serialize(value) {
				if (typeof value !== "string") throw new TypeError("Cron must be a string");
				return value;
			},
			parseValue(value) {
				if (typeof value !== "string" || !validateCronExpression(value)) throw new TypeError("Cron must be a valid cron expression");
				return value;
			},
			parseLiteral(node) {
				if (node.kind !== Kind.STRING || !validateCronExpression(node.value)) throw new TypeError("Cron must be a valid cron expression");
				return node.value;
			}
		}),
		JSON: new GraphQLScalarType({
			name: "JSON",
			serialize: (value) => value,
			parseValue: (value) => value,
			parseLiteral: parseJsonLiteral
		}),
		Query: {
			jobs: () => scheduler.getJobs(),
			job: (_parent, { id }) => scheduler.getJob(id),
			jobsByTag: (_parent, { tag }) => scheduler.getJobsByTag(tag),
			jobsByStatus: (_parent, { status }) => scheduler.getJobsByStatus(status)
		},
		Mutation: {
			createJob: (_parent, { input }) => scheduler.createJob(input),
			updateJob: (_parent, { id, input }) => scheduler.updateJob(id, input),
			deleteJob: (_parent, { id }) => scheduler.deleteJob(id),
			pauseJob: (_parent, { id }) => scheduler.pauseJob(id),
			resumeJob: (_parent, { id }) => scheduler.resumeJob(id),
			triggerJobNow: (_parent, { id }) => scheduler.triggerJobNow(id)
		},
		Subscription: {
			jobStatusChanged: { subscribe: () => projectEvents(scheduler, [
				"created",
				"updated",
				"started",
				"paused",
				"resumed"
			], "jobStatusChanged") },
			jobCompleted: { subscribe: () => projectEvents(scheduler, ["completed"], "jobCompleted") },
			jobFailed: { subscribe: () => projectEvents(scheduler, ["failed"], "jobFailed") }
		}
	};
}
//#endregion
//#region src/indexeddb.ts
var IndexedDBCronStorage = class {
	#database;
	constructor(name = "graphql-local-cron") {
		this.#database = openDB(name, 1, { upgrade(database) {
			const store = database.createObjectStore("jobs", { keyPath: "id" });
			store.createIndex("by-status", "status");
			store.createIndex("by-next-run", "nextRun");
			store.createIndex("by-tag", "tags", { multiEntry: true });
		} });
	}
	async get(id) {
		return (await this.#database).get("jobs", id).then((job) => job ?? null);
	}
	async list() {
		return (await this.#database).getAll("jobs");
	}
	async listByStatus(status) {
		return (await this.#database).getAllFromIndex("jobs", "by-status", status);
	}
	async listByTag(tag) {
		return (await this.#database).getAllFromIndex("jobs", "by-tag", tag);
	}
	async put(job) {
		await (await this.#database).put("jobs", job);
	}
	async delete(id) {
		const database = await this.#database;
		if (!await database.get("jobs", id)) return false;
		await database.delete("jobs", id);
		return true;
	}
};
//#endregion
export { CronScheduler, IndexedDBCronStorage, JobStatus, MemoryCronStorage, createResolvers, nextCronRun, typeDefs, validateCronExpression };
