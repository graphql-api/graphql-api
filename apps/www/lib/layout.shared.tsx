import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'GraphQL API',
      url: '/',
      transparentMode: 'top',
    },
    githubUrl: 'https://github.com/graphql-api/graphql-api',
    themeSwitch: { enabled: false },
    links: [
      { text: 'Packages', url: '/docs/packages' },
      { text: 'Architecture', url: '/docs/architecture' },
      { text: 'Publishing', url: '/docs/publishing' },
    ],
  }
}
