type Props = {
  sideAName: string
  sideBName: string
  value: 'P1' | 'P2'
  disabled: boolean
  onChange: (player: 'P1' | 'P2') => void
}

export function PlayerSelector({
  sideAName,
  sideBName,
  value,
  disabled,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-arena-violet/20 bg-arena-night/40 px-4 py-3">
      <span className="font-display text-arena-2xs uppercase tracking-[0.18em] text-white/45">
        I played as
      </span>
      <div className="flex gap-2">
        {(
          [
            { value: 'P1' as const, name: sideAName, label: 'P1' },
            { value: 'P2' as const, name: sideBName, label: 'P2' },
          ] as const
        ).map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={[
                'flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors duration-150',
                'disabled:cursor-not-allowed disabled:opacity-40',
                active
                  ? 'border-arena-cyan/50 bg-arena-cyan/10 text-white'
                  : 'border-arena-violet/20 bg-arena-void/50 text-white/55 hover:border-arena-violet/40 hover:text-white/80',
              ].join(' ')}
            >
              <span
                className={[
                  'shrink-0 rounded px-1.5 py-0.5 font-display text-arena-2xs uppercase tracking-[0.12em] transition-colors duration-150',
                  active
                    ? 'bg-arena-cyan/20 text-arena-cyan'
                    : 'bg-arena-violet/10 text-white/40',
                ].join(' ')}
              >
                {opt.label}
              </span>
              <span className="truncate text-arena-xs">{opt.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
