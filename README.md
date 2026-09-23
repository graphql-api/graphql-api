# GraphQL API

[![CI](https://github.com/graphql-api/graphql-api/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/graphql-api/graphql-api/actions/workflows/ci.yml)
![Node 24](https://img.shields.io/badge/node-24-5FA04E)
![pnpm 12](https://img.shields.io/badge/pnpm-12-F69220)
![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6)
![dark mode only](https://img.shields.io/badge/docs-dark--only-111111)

A modern, schema-first home for reusable GraphQL integrations.

> **2026 modernization:** the active workspace is being rebuilt deliberately. Repository presence is not treated as support: every package is classified, verified and migrated independently.

## Current baseline

- Node.js 24 + pnpm 12.6
- Turborepo 2.10
- TypeScript 7
- Next.js 16.3 + React 19.3
- Fumadocs 16.15
- shadcn-compatible UI + Tailwind CSS 4
- Biome 2.5
- dark-mode-only docs
- frozen-lockfile GitHub Actions verification

```text
apps/
└── www/          # public Fumadocs site + animated package catalog
packages/         # modern packages enter here only after validation
legacy/           # migration boundary notes
```

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm docs
```

## Status vocabulary

| Badge | Meaning |
| --- | --- |
| ![reference](https://img.shields.io/badge/status-reference-2ea44f) | selected to prove the modern package contract |
| ![migrate](https://img.shields.io/badge/status-migrate-0969da) | implementation worth porting |
| ![audit](https://img.shields.io/badge/status-audit-d97706) | upstream API/protocol must be verified first |
| ![repair](https://img.shields.io/badge/status-repair-d1242f) | package identity/metadata is incorrect |
| ![scaffold](https://img.shields.io/badge/status-scaffold-6e7781) | incomplete or non-package repository |
| ![historical](https://img.shields.io/badge/status-historical-8250df) | useful evidence, not a supported release target |

## Organization catalog

The table is generated from the same migration inventory used by the docs. The docs add an animated flow and illustrative target operation for **every entry**.

| Repository | Package identity | Status | Category | Runtime |
| --- | --- | --- | --- | --- |
| [graphql-api](https://github.com/graphql-api/graphql-api) | — | ![reference](https://img.shields.io/badge/status-reference-2ea44f) | core | `node` `browser` |
| [apollo-datasource-ftp](https://github.com/graphql-api/apollo-datasource-ftp) | `@graphql-api/apollo-datasource-ftp` | ![historical](https://img.shields.io/badge/status-historical-8250df) | filesystem | `node` |
| [graphql-iso-textile](https://github.com/graphql-api/graphql-iso-textile) | `@graphql-api/textile` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | storage | `node` |
| [graphql-api-stripe](https://github.com/graphql-api/graphql-api-stripe) | `@graphql-api/stripe` | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` `edge` |
| [graphql-local-file-system-access](https://github.com/graphql-api/graphql-local-file-system-access) | `@graphql-local/file-system-access` | ![reference](https://img.shields.io/badge/status-reference-2ea44f) | filesystem | `browser` |
| [graphql-api-vercel](https://github.com/graphql-api/graphql-api-vercel) | `@graphql-api/vercel` | ![audit](https://img.shields.io/badge/status-audit-d97706) | runtime | `node` `edge` |
| [graphql-api-template](https://github.com/graphql-api/graphql-api-template) | `@graphql-api/template` | ![historical](https://img.shields.io/badge/status-historical-8250df) | template | `node` |
| [graphql-api-netlify](https://github.com/graphql-api/graphql-api-netlify) | `@graphql-api/netlify` | ![audit](https://img.shields.io/badge/status-audit-d97706) | runtime | `node` `edge` |
| [graphql-local-textile](https://github.com/graphql-api/graphql-local-textile) | `@graphql-local/textile` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | storage | `browser` `node` |
| [graphql-api-rossum](https://github.com/graphql-api/graphql-api-rossum) | `@graphql-api/rossum` | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` |
| [graphql-api-sevdesk](https://github.com/graphql-api/graphql-api-sevdesk) | — | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` |
| [graphql-api-debitoor](https://github.com/graphql-api/graphql-api-debitoor) | — | ![scaffold](https://img.shields.io/badge/status-scaffold-6e7781) | api | `node` |
| [graphql-api-etsy](https://github.com/graphql-api/graphql-api-etsy) | — | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` |
| [graphql-schema](https://github.com/graphql-api/graphql-schema) | — | ![scaffold](https://img.shields.io/badge/status-scaffold-6e7781) | tooling | `node` |
| [graphql-iso-space-storage](https://github.com/graphql-api/graphql-iso-space-storage) | `@graphql-local/space-storage` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | storage | `browser` `node` |
| [graphql-api-magic](https://github.com/graphql-api/graphql-api-magic) | — | ![audit](https://img.shields.io/badge/status-audit-d97706) | identity | `browser` `node` |
| [apollo-link-worker](https://github.com/graphql-api/apollo-link-worker) | `@graphql-local/apollo-link-worker` | ![historical](https://img.shields.io/badge/status-historical-8250df) | runtime | `worker` |
| [graphql-api-pinata](https://github.com/graphql-api/graphql-api-pinata) | `@graphql-api/pinata` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | storage | `node` `edge` |
| [graphql-api-infura](https://github.com/graphql-api/graphql-api-infura) | `@graphql-api/infura` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | storage | `node` `edge` |
| [graphql-api-nft-storage](https://github.com/graphql-api/graphql-api-nft-storage) | `@graphql-api/nft-storage` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | storage | `node` `edge` |
| [exspiration](https://github.com/graphql-api/exspiration) | — | ![scaffold](https://img.shields.io/badge/status-scaffold-6e7781) | tooling | `node` |
| [graphql-local-ipfs](https://github.com/graphql-api/graphql-local-ipfs) | `@graphql-local/ipfs` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | p2p | `browser` `node` |
| [graphql-api-components-ai](https://github.com/graphql-api/graphql-api-components-ai) | `@graphql-api/components-ai` | ![audit](https://img.shields.io/badge/status-audit-d97706) | ai | `browser` `node` |
| [graphql-api-youtube](https://github.com/graphql-api/graphql-api-youtube) | `@graphql-api/youtube` | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` |
| [graphql-module-template](https://github.com/graphql-api/graphql-module-template) | — | ![historical](https://img.shields.io/badge/status-historical-8250df) | template | `node` |
| [graphql-api-symbl](https://github.com/graphql-api/graphql-api-symbl) | `@graphql-api/symbl` | ![audit](https://img.shields.io/badge/status-audit-d97706) | ai | `node` |
| [graphql-api-notion](https://github.com/graphql-api/graphql-api-notion) | `@graphql-api/notion` | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` |
| [graphql-api-sftp](https://github.com/graphql-api/graphql-api-sftp) | `@graphql-api/sftp` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | filesystem | `node` |
| [graphql-api-slate-host](https://github.com/graphql-api/graphql-api-slate-host) | `@graphql-api/slate-host` | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `node` |
| [graphql-api-openai-gpt3](https://github.com/graphql-api/graphql-api-openai-gpt3) | — | ![audit](https://img.shields.io/badge/status-audit-d97706) | ai | `node` |
| [graphql-api.github.io](https://github.com/graphql-api/graphql-api.github.io) | — | ![historical](https://img.shields.io/badge/status-historical-8250df) | site | `browser` |
| [graphql-iso-ftp](https://github.com/graphql-api/graphql-iso-ftp) | `@graphql-api/ftp` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | filesystem | `node` |
| [apollo-datasource-webdav](https://github.com/graphql-api/apollo-datasource-webdav) | `@graphql-api/apollo-datasource-webdav` | ![historical](https://img.shields.io/badge/status-historical-8250df) | filesystem | `node` |
| [types](https://github.com/graphql-api/types) | `@graphql-api/types` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | core | `browser` `node` `edge` `worker` |
| [graphql-iso-webdav](https://github.com/graphql-api/graphql-iso-webdav) | `@graphql-api/webdav` | ![migrate](https://img.shields.io/badge/status-migrate-0969da) | filesystem | `node` `browser` |
| [graphql-api-plaid](https://github.com/graphql-api/graphql-api-plaid) | `@graphql-api/template` | ![repair](https://img.shields.io/badge/status-repair-d1242f) | api | `node` |
| [next-apollo-handler](https://github.com/graphql-api/next-apollo-handler) | — | ![historical](https://img.shields.io/badge/status-historical-8250df) | runtime | `node` |
| [cloudflare-worker-apollo-handler](https://github.com/graphql-api/cloudflare-worker-apollo-handler) | — | ![historical](https://img.shields.io/badge/status-historical-8250df) | runtime | `worker` |
| [branding](https://github.com/graphql-api/branding) | — | ![scaffold](https://img.shields.io/badge/status-scaffold-6e7781) | site | `browser` |
| [graphql-api-obsidian](https://github.com/graphql-api/graphql-api-obsidian) | — | ![audit](https://img.shields.io/badge/status-audit-d97706) | api | `browser` `node` |
| [graphql-api-umami](https://github.com/graphql-api/graphql-api-umami) | `@graphql-api/template` | ![repair](https://img.shields.io/badge/status-repair-d1242f) | api | `node` `edge` |
| [graphql-api-stackblitz](https://github.com/graphql-api/graphql-api-stackblitz) | `@graphql-api/stackblitz` | ![reference](https://img.shields.io/badge/status-reference-2ea44f) | api | `browser` `node` |
| [graphql-fs](https://github.com/graphql-api/graphql-fs) | `@graphql-api/template` | ![repair](https://img.shields.io/badge/status-repair-d1242f) | filesystem | `browser` `node` |
| [graphql-local-cron](https://github.com/graphql-api/graphql-local-cron) | `@graphql-local/cron` | ![reference](https://img.shields.io/badge/status-reference-2ea44f) | runtime | `browser` `node` |

## Modernization order

1. `@graphql-local/cron`
2. `@graphql-api/stackblitz`
3. `@graphql-local/file-system-access`
4. `@graphql-local/ipfs` → Helia/IPLD/CAR foundation
5. shared event/transport/worker contracts
6. GraphQL agent-protocol adapters (A2A, MCP, ACP, OpenClaw)
7. service wrappers only after upstream freshness audits

Published integrations should expose deterministic SDL, generated resolver types, explicit runtime capabilities, explicit configuration and reproducible tests. Federation remains optional.

## Protocol direction

GraphQL is the typed control/discovery layer. Native protocol semantics stay beneath it:

```text
GraphQL
├── A2A / MCP / ACP / OpenClaw adapters
├── UCAN capabilities
├── IPLD + CAR snapshots/artifacts
├── SSE + graphql-transport-ws
├── Worker RPC/stream adapters
└── libp2p/IPFS + optional verified WebTorrent cache
```

See the docs for agent orchestration, content-addressed snapshots, streaming/Workers and P2P design.

## Publishing

The repository is being prepared for Changesets + npm Trusted Publishing (OIDC/provenance). No long-lived npm write token should be introduced.

Before the first package publish:
1. verify npm owner/maintainer rights for the relevant `@graphql-api` / `@graphql-local` package;
2. migrate and verify the package in the modern workspace;
3. add a changeset;
4. configure the exact GitHub workflow as the npm Trusted Publisher;
5. publish only from verified CI.

See [MODERNIZATION.md](./MODERNIZATION.md) and `apps/www/content/docs/publishing.mdx`.
