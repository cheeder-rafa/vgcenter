import type { MetaSet } from '../data/metaSets'

type Props = {
  metaSet: MetaSet | null
  onApply: (set: MetaSet) => void
  accent: 'plasma' | 'cyan'
}

function formatId(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function MetaSetButton({ metaSet, onApply, accent }: Props) {
  if (metaSet === null) {
    return null
  }

  const chipColor =
    accent === 'plasma'
      ? 'text-arena-plasma hover:bg-arena-plasma/10 focus-visible:outline-arena-plasma'
      : 'text-arena-cyan hover:bg-arena-cyan/10 focus-visible:outline-arena-cyan'

  const dotColor = accent === 'plasma' ? 'text-arena-plasma/40' : 'text-arena-cyan/40'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="arena-label text-arena-violet">Meta Set</span>
          <a
            href={metaSet.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            translate="no"
            className="font-mono text-[0.6rem] uppercase tracking-widest text-white/25 transition-colors hover:text-white/50"
          >
            Pikalytics ↗
          </a>
        </div>
        <button
          type="button"
          onClick={() => onApply(metaSet)}
          className={`arena-chip cursor-pointer transition-colors ${chipColor} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
        >
          Use Meta Set
        </button>
      </div>
      <p className="font-mono text-[0.62rem] leading-relaxed text-white/30">
        {metaSet.moveIds.map((id, i) => (
          <span key={id}>
            {i > 0 && <span className={`mx-1 ${dotColor}`}>·</span>}
            {formatId(id)}
          </span>
        ))}
      </p>
    </div>
  )
}
