import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projects = JSON.parse(
  execFileSync('pnpm', ['list', '-r', '--depth', '-1', '--json'], {
    encoding: 'utf8',
  }),
)

const publishable = projects.filter(
  (project) => project.name && !project.private && project.name !== 'graphql-api',
)
const errors = []

for (const project of publishable) {
  const manifest = JSON.parse(readFileSync(join(project.path, 'package.json'), 'utf8'))
  const repository =
    typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url
  const hasCanonicalRepository =
    typeof repository === 'string' &&
    /github\.com[/:]graphql-api\/graphql-api(?:\.git)?$/.test(repository.replace(/^git\+/, ''))

  if (!/^@graphql-(?:api|local)\//.test(manifest.name)) {
    errors.push(`${manifest.name}: package name must use @graphql-api/* or @graphql-local/*`)
  }
  if (manifest.version === '0.0.0') {
    errors.push(`${manifest.name}: placeholder version 0.0.0 is not publishable`)
  }
  if (!hasCanonicalRepository) {
    errors.push(`${manifest.name}: repository.url must point to graphql-api/graphql-api`)
  }
  if (manifest.publishConfig?.access !== 'public') {
    errors.push(`${manifest.name}: publishConfig.access must be public`)
  }
  if (typeof manifest.scripts?.check !== 'string') {
    errors.push(`${manifest.name}: scripts.check is required before publishing`)
  }
}

if (errors.length > 0) {
  console.error('Release readiness failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  publishable.length === 0
    ? 'Release readiness: no public workspace packages yet.'
    : `Release readiness: ${publishable.length} public package(s) satisfy the manifest contract.`,
)
