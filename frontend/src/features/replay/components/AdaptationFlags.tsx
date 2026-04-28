type Props = { flags: string[] }

export function AdaptationFlags({ flags }: Props) {
  if (flags.length === 0) return null
  return (
    <section
      data-testid="adaptation-flags"
      className="flex flex-col gap-2 rounded-2xl border border-arena-cyan/30 bg-arena-cyan/[0.05] p-4"
    >
      <h2 className="font-display text-arena-2xs uppercase tracking-[0.18em] text-arena-cyan">
        BO3 Adaptation
      </h2>
      <ul className="flex flex-col gap-1.5 text-[0.82rem] text-white/80">
        {flags.map((flag, idx) => (
          <li key={idx} className="flex gap-2">
            <span aria-hidden className="text-arena-cyan">
              ▸
            </span>
            <span>{flag}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
