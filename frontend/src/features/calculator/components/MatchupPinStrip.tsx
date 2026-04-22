import { usePinStore, type MatchupPin } from '../store/usePinStore'

type Props = {
  onLoadPin: (pin: MatchupPin) => void
  onCurrentPin: () => void
}

export function MatchupPinStrip({ onLoadPin, onCurrentPin }: Props) {
  const pins = usePinStore((s) => s.pins)
  const removePin = usePinStore((s) => s.removePin)

  return (
    <div
      data-testid="pin-strip"
      className="flex items-center gap-2 overflow-x-auto pb-1"
    >
      <button
        data-testid="pin-current-button"
        onClick={onCurrentPin}
        className="arena-chip shrink-0 cursor-pointer text-arena-plasma transition hover:bg-arena-plasma/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
      >
        Pin current
      </button>

      {pins.length === 0 ? (
        <span
          data-testid="pin-strip-empty"
          className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/25"
        >
          No saved matchups yet
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {pins.map((pin) => (
            <div
              key={pin.id}
              role="button"
              tabIndex={0}
              data-testid={`pin-card-${pin.id}`}
              onClick={() => onLoadPin(pin)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onLoadPin(pin)
                }
              }}
              className="group relative flex cursor-pointer flex-col rounded-sm border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:border-arena-violet/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
            >
              <div className="flex items-center gap-1.5 pr-4">
                <span className="font-display text-xs font-semibold text-white/90">
                  {pin.attackerName}
                </span>
                <span className="font-mono text-[0.6rem] text-white/35">→</span>
                <span className="font-display text-xs font-semibold text-white/90">
                  {pin.defenderName}
                </span>
              </div>
              <div className="mt-0.5 flex gap-2">
                <span className="font-mono text-[0.6rem] tabular-nums text-arena-plasma/75">
                  {pin.attackerSummary}
                </span>
                <span className="font-mono text-[0.6rem] tabular-nums text-arena-cyan/75">
                  {pin.defenderSummary}
                </span>
              </div>
              <button
                data-testid={`pin-delete-${pin.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removePin(pin.id)
                }}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-sm font-mono text-[0.6rem] text-white/30 opacity-0 transition-opacity hover:bg-white/10 hover:text-white/70 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-cyan"
                aria-label={`Remove pin ${pin.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
