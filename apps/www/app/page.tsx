import Link from 'next/link'
import { ArrowRight, Boxes, GitBranch, Github, Network, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const pillars = [
  {
    icon: Network,
    title: 'Schema first',
    description: 'Portable GraphQL SDL and generated types remain the contract, independent of a specific server.',
  },
  {
    icon: Boxes,
    title: 'Composable packages',
    description: 'Integrations expose explicit runtime capabilities and can opt into Federation 2 when deployment needs it.',
  },
  {
    icon: GitBranch,
    title: 'Git-native delivery',
    description: 'Source, release metadata and migration history stay reviewable and reproducible from Git.',
  },
]

export default function HomePage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_34%),radial-gradient(circle_at_80%_20%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          modernizing the GraphQL integration layer
        </div>

        <div className="max-w-4xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-primary">graphql-api</p>
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Small GraphQL integrations.
            <span className="block text-muted-foreground">Clear contracts. Modern runtimes.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            A public workspace for reusable API wrappers, browser-local GraphQL utilities, schema tooling and optional Federation 2 composition.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/docs">Read the docs <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/graphql-api/graphql-api" target="_blank" rel="noreferrer">
                <Github className="size-4" /> GitHub
              </a>
            </Button>
          </div>
        </div>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-3 size-5 text-primary" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-px bg-gradient-to-r from-primary/35 via-border to-transparent" />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-border/80 bg-card/40 p-6 font-mono text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span><span className="text-primary">runtime</span> node · edge · browser</span>
            <span><span className="text-primary">schema</span> GraphQL SDL</span>
            <span><span className="text-primary">composition</span> Federation optional</span>
            <span><span className="text-primary">release</span> OIDC + provenance next</span>
          </div>
        </section>
      </div>
    </main>
  )
}
