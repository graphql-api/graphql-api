import type { MDXComponents } from 'mdx/types'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { PackageCatalog } from '@/components/package-catalog'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    PackageCatalog,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
