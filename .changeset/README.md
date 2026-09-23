# Changesets

This directory records release intent for public packages in the modern workspace.

## Add release intent

```bash
pnpm changeset
```

Only packages that have completed migration into the active pnpm workspace may receive a changeset.

## Release model

1. Feature PR adds code plus a changeset.
2. `release.yml` maintains a version PR on `master`.
3. Merge the version PR after normal CI is green.
4. Publish an explicitly selected package through `publish.yml`.
5. npm Trusted Publishing supplies short-lived OIDC credentials and provenance; no long-lived npm write token is expected.

Until npm ownership and Trusted Publisher configuration are verified for a package, the publish workflow is intentionally a hard external gate.
