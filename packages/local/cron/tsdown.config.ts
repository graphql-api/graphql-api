import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: {
    generator: 'oxc',
    resolver: 'oxc',
  },
  clean: true,
  platform: 'neutral',
  deps: {
    neverBundle: ['graphql'],
  },
  failOnWarn: 'ci-only',
  publint: 'ci-only',
  attw: 'ci-only',
})
