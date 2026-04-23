type LegendEntry = { label: string; name: string; description: string }

const ENTRIES: LegendEntry[] = [
  {
    label: 'PRO',
    name: 'Protect',
    description: 'Protect or Detect is available to shield from damage turn 1.',
  },
  {
    label: 'RED',
    name: 'Redirection',
    description:
      'Redirection available (Follow Me / Rage Powder) to pull attacks off the partner.',
  },
  {
    label: 'FO',
    name: 'Fake Out',
    description: 'Fake Out is available for a guaranteed flinch on turn 1.',
  },
  {
    label: 'PRI',
    name: 'Priority',
    description:
      'A priority move (Extreme Speed, Quick Attack, Aqua Jet, etc.) is available.',
  },
  {
    label: 'TW',
    name: 'Tailwind',
    description: 'Tailwind can be set for speed control.',
  },
  {
    label: 'TR',
    name: 'Trick Room',
    description: 'Trick Room can be set to invert the speed order.',
  },
]

export function CellFlagsLegend() {
  return (
    <div className="flex flex-col gap-2 rounded border border-white/10 bg-arena-surface/60 p-3">
      <h4 className="text-xs uppercase tracking-widest text-white/55">
        Turn-1 flags legend
      </h4>
      <ul className="flex flex-wrap gap-2 text-xs">
        {ENTRIES.map((entry) => (
          <li
            key={entry.label}
            className="flex items-center gap-1.5"
            title={`${entry.name}: ${entry.description}`}
          >
            <span className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white/80">
              {entry.label}
            </span>
            <span className="text-white/70">{entry.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
