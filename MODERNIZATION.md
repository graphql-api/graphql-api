# 2026 modernization

This change rebuilds the active root rather than pretending the Nx 13 workspace can be made current by changing version strings.

## Dependency baseline

Checked on 2026-09-23:

- Node 24 runtime baseline
- pnpm 12.6.0
- Next.js 16.3.6
- React / React DOM 19.3.0
- TypeScript 7.0.2
- Turborepo 2.10.13
- Tailwind CSS / PostCSS integration 4.3.3
- Fumadocs Core 16.15.13
- Fumadocs UI 16.15.13
- Fumadocs MDX 15.4.3
- shadcn CLI 4.21.0
- Biome 2.5.14

## Migration boundary

The old workspace used Nx 13, pnpm 6, Next.js 12, React 17, GraphQL 15 and Apollo Server/Federation generations that are no longer an appropriate active baseline. Historical source remains in Git history and package repositories; integrations return to the active workspace only after build, schema and upstream-API validation.

## Lockfile

The legacy pnpm 6 lockfile was replaced with a pnpm 12 lockfile generated from the modern workspace. Normal CI uses `--frozen-lockfile`; any dependency change must regenerate and commit the lockfile before merge or publish.
