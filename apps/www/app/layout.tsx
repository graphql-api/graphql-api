import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'GraphQL API', template: '%s · GraphQL API' },
  description: 'Schema-first GraphQL integrations for modern runtimes.',
  metadataBase: new URL('https://graphql-api.github.io'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <RootProvider theme={{ enabled: false, hotKey: false }}>{children}</RootProvider>
      </body>
    </html>
  )
}
