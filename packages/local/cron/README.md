# @graphql-local/cron

Local cron scheduling with a GraphQL projection, explicit storage adapters and event streams.

This package is the first reference migration from the historical `graphql-api/graphql-local-cron` repository into the modern GraphQL API workspace.

## Design changes

The migration deliberately removes hidden side effects from construction:

- no automatic Service Worker registration;
- no automatic Web Worker creation;
- no `eval`-based task execution;
- no Apollo-specific dependency;
- no global online/visibility listeners.

Instead, callers register task handlers explicitly and choose Memory or IndexedDB storage.

## Install

```bash
pnpm add @graphql-local/cron graphql
```

## Scheduler

```ts
import { CronScheduler, IndexedDBCronStorage } from '@graphql-local/cron'

const cron = new CronScheduler({
  storage: new IndexedDBCronStorage('my-app-cron'),
})

cron.registerTask('SYNC', async (payload) => {
  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(payload.data),
  })
})

await cron.createJob({
  name: 'sync every 15 minutes',
  schedule: '*/15 * * * *',
  task: {
    type: 'SYNC',
    data: { collection: 'documents' },
  },
})

cron.start()
```

For deterministic tests or externally driven runtimes, do not call `start()`; call `tick()` explicitly.

## GraphQL

```ts
import { createResolvers, typeDefs } from '@graphql-local/cron'

const resolvers = createResolvers(cron)
```

The schema exposes job queries/mutations plus `jobStatusChanged`, `jobCompleted` and `jobFailed` subscriptions. Transport remains the host application's choice (SSE, `graphql-transport-ws`, local execution, etc.).

## Runtime contract

The scheduler core works without browser globals. IndexedDB storage is opt-in and requires an IndexedDB-capable runtime. This keeps SSR/Node imports side-effect free while preserving the browser-local use case.

## Release

The package is versioned through Changesets in the root workspace. npm publication is gated by the root `publish.yml` workflow and npm Trusted Publishing/OIDC.
