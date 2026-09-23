import { GraphQLScalarType } from "graphql";
//#region src/types.d.ts
type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonValue[] | {
  [key: string]: JsonValue;
};
export declare enum JobStatus {
  Scheduled = "SCHEDULED",
  Running = "RUNNING",
  Failed = "FAILED",
  Paused = "PAUSED"
}
interface TaskPayload {
  type: string;
  data: JsonValue;
}
interface CronJob {
  id: string;
  name: string;
  schedule: string;
  task: TaskPayload;
  status: JobStatus;
  retryAttempts: number;
  maxRetries: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  nextRun: string;
  lastError?: string;
}
interface CronJobInput {
  name: string;
  schedule: string;
  task: TaskPayload;
  maxRetries?: number;
  tags?: string[];
}
interface JobExecutionContext {
  jobId: string;
  retryCount: number;
  startedAt: string;
}
type TaskHandler = (payload: TaskPayload, context: JobExecutionContext) => Promise<unknown> | unknown;
interface CronStorage {
  get(id: string): Promise<CronJob | null>;
  list(): Promise<CronJob[]>;
  listByStatus(status: JobStatus): Promise<CronJob[]>;
  listByTag(tag: string): Promise<CronJob[]>;
  put(job: CronJob): Promise<void>;
  delete(id: string): Promise<boolean>;
}
type CronEventType = "created" | "updated" | "deleted" | "started" | "paused" | "resumed" | "completed" | "failed";
interface CronEvent {
  type: CronEventType;
  at: string;
  jobId: string;
  job?: CronJob;
  result?: unknown;
  error?: string;
}
interface CronSchedulerOptions {
  storage?: CronStorage;
  intervalMs?: number;
  maxConcurrentJobs?: number;
  defaultMaxRetries?: number;
  retryBaseDelayMs?: number;
  maxRetryDelayMs?: number;
  now?: () => Date;
  createId?: () => string;
}
//#endregion
//#region src/scheduler.d.ts
export declare function validateCronExpression(expression: string): boolean;
export declare function nextCronRun(expression: string, currentDate?: Date): Date;
export declare class CronScheduler {
  #private;
  constructor(options?: CronSchedulerOptions);
  registerTask(type: string, handler: TaskHandler): () => void;
  start(): void;
  stop(): void;
  createJob(input: CronJobInput): Promise<CronJob>;
  updateJob(id: string, input: CronJobInput): Promise<CronJob>;
  deleteJob(id: string): Promise<boolean>;
  pauseJob(id: string): Promise<CronJob>;
  resumeJob(id: string): Promise<CronJob>;
  triggerJobNow(id: string): Promise<CronJob>;
  getJob(id: string): Promise<CronJob | null>;
  getJobs(): Promise<CronJob[]>;
  getJobsByStatus(status: JobStatus): Promise<CronJob[]>;
  getJobsByTag(tag: string): Promise<CronJob[]>;
  on(listener: (event: CronEvent) => void): () => void;
  events(types?: readonly CronEventType[]): AsyncIterableIterator<CronEvent>;
  tick(): Promise<void>;
  destroy(): void;
}
//#endregion
//#region src/graphql.d.ts
export declare const typeDefs = "\n  scalar DateTime\n  scalar Cron\n  scalar JSON\n\n  enum JobStatus {\n    SCHEDULED\n    RUNNING\n    FAILED\n    PAUSED\n  }\n\n  type TaskPayload {\n    type: String!\n    data: JSON!\n  }\n\n  input TaskPayloadInput {\n    type: String!\n    data: JSON!\n  }\n\n  type CronJob {\n    id: ID!\n    name: String!\n    schedule: Cron!\n    task: TaskPayload!\n    status: JobStatus!\n    retryAttempts: Int!\n    maxRetries: Int!\n    tags: [String!]!\n    createdAt: DateTime!\n    updatedAt: DateTime!\n    lastRun: DateTime\n    nextRun: DateTime!\n    lastError: String\n  }\n\n  input CronJobInput {\n    name: String!\n    schedule: Cron!\n    task: TaskPayloadInput!\n    maxRetries: Int\n    tags: [String!]\n  }\n\n  type Query {\n    jobs: [CronJob!]!\n    job(id: ID!): CronJob\n    jobsByTag(tag: String!): [CronJob!]!\n    jobsByStatus(status: JobStatus!): [CronJob!]!\n  }\n\n  type Mutation {\n    createJob(input: CronJobInput!): CronJob!\n    updateJob(id: ID!, input: CronJobInput!): CronJob!\n    deleteJob(id: ID!): Boolean!\n    pauseJob(id: ID!): CronJob!\n    resumeJob(id: ID!): CronJob!\n    triggerJobNow(id: ID!): CronJob!\n  }\n\n  type Subscription {\n    jobStatusChanged: CronJob!\n    jobCompleted: CronJob!\n    jobFailed: CronJob!\n  }\n";
interface CronResolverMap {
  DateTime: GraphQLScalarType;
  Cron: GraphQLScalarType;
  JSON: GraphQLScalarType;
  Query: {
    jobs: () => Promise<CronJob[]>;
    job: (_parent: unknown, args: {
      id: string;
    }) => Promise<CronJob | null>;
    jobsByTag: (_parent: unknown, args: {
      tag: string;
    }) => Promise<CronJob[]>;
    jobsByStatus: (_parent: unknown, args: {
      status: JobStatus;
    }) => Promise<CronJob[]>;
  };
  Mutation: {
    createJob: (_parent: unknown, args: {
      input: CronJobInput;
    }) => Promise<CronJob>;
    updateJob: (_parent: unknown, args: {
      id: string;
      input: CronJobInput;
    }) => Promise<CronJob>;
    deleteJob: (_parent: unknown, args: {
      id: string;
    }) => Promise<boolean>;
    pauseJob: (_parent: unknown, args: {
      id: string;
    }) => Promise<CronJob>;
    resumeJob: (_parent: unknown, args: {
      id: string;
    }) => Promise<CronJob>;
    triggerJobNow: (_parent: unknown, args: {
      id: string;
    }) => Promise<CronJob>;
  };
  Subscription: {
    jobStatusChanged: {
      subscribe: () => AsyncIterableIterator<Record<string, unknown>>;
    };
    jobCompleted: {
      subscribe: () => AsyncIterableIterator<Record<string, unknown>>;
    };
    jobFailed: {
      subscribe: () => AsyncIterableIterator<Record<string, unknown>>;
    };
  };
}
export declare function createResolvers(scheduler: CronScheduler): CronResolverMap;
//#endregion
//#region src/indexeddb.d.ts
export declare class IndexedDBCronStorage implements CronStorage {
  #private;
  constructor(name?: string);
  get(id: string): Promise<CronJob | null>;
  list(): Promise<CronJob[]>;
  listByStatus(status: JobStatus): Promise<CronJob[]>;
  listByTag(tag: string): Promise<CronJob[]>;
  put(job: CronJob): Promise<void>;
  delete(id: string): Promise<boolean>;
}
//#endregion
//#region src/storage.d.ts
export declare class MemoryCronStorage implements CronStorage {
  #private;
  get(id: string): Promise<CronJob | null>;
  list(): Promise<CronJob[]>;
  listByStatus(status: JobStatus): Promise<CronJob[]>;
  listByTag(tag: string): Promise<CronJob[]>;
  put(job: CronJob): Promise<void>;
  delete(id: string): Promise<boolean>;
}
//#endregion
export type { CronEvent, CronEventType, CronJob, CronJobInput, CronSchedulerOptions, CronStorage, JobExecutionContext, JsonPrimitive, JsonValue, TaskHandler, TaskPayload };