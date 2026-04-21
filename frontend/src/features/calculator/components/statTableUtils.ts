export const MAX_SP_PER_STAT = 32

export function clampSp(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  if (value < 0) {
    return 0
  }
  if (value > MAX_SP_PER_STAT) {
    return MAX_SP_PER_STAT
  }
  return Math.floor(value)
}
