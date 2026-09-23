# GraphQL API

A modern, schema-first home for reusable GraphQL integrations.

> **2026 modernization:** the active workspace is being rebuilt on current Node, pnpm, TypeScript, Next.js, React, Fumadocs and shadcn/ui. Historical integrations remain available in Git history until each package is validated against its current upstream API and migrated deliberately.

## Stack

- Node.js 24+
- pnpm 12
- Turborepo
- TypeScript 7
- Next.js 16 + React 19
- Fumadocs
- shadcn/ui + Tailwind CSS 4
- dark mode only

## Workspace

```text
apps/
└── www/        # public docs and project landing page
packages/       # historical integration sources; migrated package-by-package
legacy/         # modernization notes and boundaries
```

The active pnpm workspace intentionally starts with the documentation app only. Legacy Nx projects are not treated as current-compatible merely because their source exists in the repository.

## Development

```bash
corepack enable
pnpm install
pnpm check
pnpm docs
```

## Package modernization order

1. `@graphql-local/cron`
2. `@graphql-api/stackblitz`
3. `@graphql-local/file-system-access`
4. one current server/API integration such as Rossum, Stripe or Notion

Published integrations should expose deterministic GraphQL SDL, generated resolver types, explicit runtime capabilities, explicit configuration and tests. Federation remains optional per package.

## Publishing

Publishing is intentionally not enabled by this commit. Before the first release we will verify npm scope ownership, add Changesets, configure npm Trusted Publishing through OIDC, enable provenance, and make schema/build checks mandatory in release CI.

See [MODERNIZATION.md](./MODERNIZATION.md) and the docs app for details.
