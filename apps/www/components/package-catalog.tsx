import { ExternalLink } from 'lucide-react'
import { packageCatalog, type PackageCatalogEntry, type PackageStatus } from '@/lib/package-catalog'

const statusLabel: Record<PackageStatus, string> = {
  reference: 'reference',
  migrate: 'migrate',
  audit: 'audit',
  repair: 'repair',
  scaffold: 'scaffold',
  historical: 'historical',
}

function PackageFlow({ entry }: { entry: PackageCatalogEntry }) {
  const [source, graph, target] = entry.flow
  return (
    <figure className="package-flow" aria-label={`${source} to ${graph} to ${target}`}>
      <div className="package-flow__rail" aria-hidden="true">
        <span className="package-flow__pulse" />
      </div>
      <div className="package-flow__nodes">
        {[source, graph, target].map((label) => (
          <span className="package-flow__node" key={label}>
            {label}
          </span>
        ))}
      </div>
    </figure>
  )
}

function PackageCard({ entry }: { entry: PackageCatalogEntry }) {
  return (
    <article className="rounded-xl border border-border/80 bg-card/55 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base font-semibold">{entry.repo}</h3>
            <span className={`package-status package-status--${entry.status}`}>
              {statusLabel[entry.status]}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {entry.pkg ?? 'repository / no verified package identity'}
          </p>
        </div>
        <a
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          href={`https://github.com/graphql-api/${entry.repo}`}
          rel="noreferrer"
          target="_blank"
        >
          source <ExternalLink className="size-3" />
        </a>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
      <PackageFlow entry={entry} />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {entry.runtime.map((runtime) => (
          <span
            className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
            key={runtime}
          >
            {runtime}
          </span>
        ))}
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {entry.category}
        </span>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Illustrative target
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
          <code>{entry.example}</code>
        </pre>
      </div>
    </article>
  )
}

export function PackageCatalog() {
  const categories = [...new Set(packageCatalog.map((entry) => entry.category))].sort()
  return (
    <div className="not-prose mt-8 space-y-10">
      <p className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
        Examples below are modernization targets, not claims about the current legacy API. A
        repository only becomes supported after its status reaches a verified release state.
      </p>
      {categories.map((category) => {
        const entries = packageCatalog.filter((entry) => entry.category === category)
        return (
          <section key={category}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="m-0 text-xl font-semibold capitalize">{category}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {entries.length} entries
              </span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {entries.map((entry) => (
                <PackageCard entry={entry} key={entry.repo} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
