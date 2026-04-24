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
    <div className="flex flex-col gap-2 rounded border border-white/8 bg-arena-void/40 p-3">
      <h4 className="arena-label text-[9px] text-white/35">
        Turn-1 flags legend
      </h4>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {ENTRIES.map((entry) => (
          <li
            key={entry.label}
            className="flex items-center gap-1.5"
            title={`${entry.name}: ${entry.description}`}
          >
            <span className="arena-chip border-white/20 py-0.5 text-white/55">
              {entry.label}
            </span>
            <span className="text-xs text-white/55">{entry.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
