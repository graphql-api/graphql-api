# Legacy workspace boundary

Before the 2026 modernization this repository combined Nx 13, pnpm 6, Next.js 12, React 17, GraphQL 15, Apollo Server 2/3 and Apollo Federation 0.x projects.

Those files are historical evidence, not a supported runtime. Git history at and before commit `b4f6972e8e08c87d219d8386cad235dcd6797d14` preserves removed app and workspace source.

Known migration issues include a stale Textile submodule URL and references to components-ai/slate-host repositories that were not found as public repositories in the organization audit. Do not silently refresh gitlinks and call that an API upgrade; validate the package implementation and its upstream service contract first.
