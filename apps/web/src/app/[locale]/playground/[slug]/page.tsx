import { experiments } from '@/data/experiments'
import { ExperimentRenderer } from '@/components/experiments/ExperimentRenderer'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }))
}

export default async function ExperimentPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const exp = experiments.find((e) => e.slug === slug)

  if (!exp) notFound()

  const title = locale === 'es' ? exp.titleEs : exp.title
  const description = locale === 'es' ? exp.descriptionEs : exp.description

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--background)]">
      {/* Full-screen canvas — client-side only */}
      <ExperimentRenderer slug={slug} />

      {/* Overlay: back + info */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6" style={{ zIndex: 60 }}>
        {/* Top bar */}
        <div className="flex items-start justify-between">
          <Link
            href={`/${locale}/playground`}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)]/80 px-3 py-2 font-mono text-xs text-[var(--muted-foreground)] backdrop-blur-sm transition-colors hover:text-[var(--accent)]"
          >
            ← playground
          </Link>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {exp.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-[var(--border)] bg-[var(--background)]/80 px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)] backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/80 p-4 backdrop-blur-sm max-w-sm">
          <h1 className="mb-1 text-lg font-bold">{title}</h1>
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{description}</p>
          <p className="mt-2 font-mono text-[10px] text-[var(--muted-foreground)]/50">
            drag to rotate · scroll to zoom
          </p>
        </div>
      </div>
    </div>
  )
}
