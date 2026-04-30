export type CellColorKey = 'dim' | 'low' | 'mid' | 'high' | 'ko' | 'ohko'

export function cellColorClass(minPct: number, maxPct: number): CellColorKey {
  if (minPct === 0 && maxPct === 0) return 'dim'
  if (maxPct < 25) return 'low'
  if (maxPct < 50) return 'mid'
  if (maxPct < 75) return 'high'
  if (maxPct < 100) return 'ko'
  return 'ohko'
}

export const COLOR_CLASS: Record<CellColorKey, string> = {
  dim: 'bg-white/5 text-white/30',
  low: 'bg-arena-cyan/10 text-arena-cyan/70',
  mid: 'bg-arena-plasma/15 text-arena-plasma/80',
  high: 'bg-arena-plasma/30 text-arena-plasma',
  ko: 'bg-arena-plasma/50 text-white font-semibold',
  ohko: 'bg-arena-ember/65 text-white font-bold ring-1 ring-arena-ember/60 shadow-[0_0_14px_rgba(251,113,133,0.35)]',
}
