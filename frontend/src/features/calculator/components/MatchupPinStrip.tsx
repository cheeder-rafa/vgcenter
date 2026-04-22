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
      className="flex items-center gap-2 overflow-x-auto py-1"
    >
      <button
        data-testid="pin-current-button"
        onClick={onCurrentPin}
        className="shrink-0 rounded border border-arena-plasma/40 bg-arena-plasma/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-arena-plasma transition hover:border-arena-plasma/70 hover:bg-arena-plasma/20"
      >
        Pin current
      </button>

      {pins.length === 0 ? (
        <span
          data-testid="pin-strip-empty"
          className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/25"
        >
          No pins — click "Pin current" to save a matchup
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {pins.map((pin) => (
            <div
              key={pin.id}
              data-testid={`pin-card-${pin.id}`}
              onClick={() => onLoadPin(pin)}
              className="group relative flex cursor-pointer flex-col rounded border border-white/10 bg-white/5 px-3 py-2 transition hover:border-arena-violet/40 hover:bg-white/10"
            >
              <div className="flex items-center gap-1.5 pr-4">
                <span className="font-display text-xs font-semibold text-white">
                  {pin.attackerName}
                </span>
                <span className="font-mono text-[0.6rem] text-white/40">→</span>
                <span className="font-display text-xs font-semibold text-white">
                  {pin.defenderName}
                </span>
              </div>
              <div className="mt-0.5 flex gap-2">
                <span className="font-mono text-[0.6rem] text-arena-plasma/80">
                  {pin.attackerSummary}
                </span>
                <span className="font-mono text-[0.6rem] text-arena-cyan/80">
                  {pin.defenderSummary}
                </span>
              </div>
              <button
                data-testid={`pin-delete-${pin.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removePin(pin.id)
                }}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full font-mono text-[0.6rem] text-white/30 opacity-0 transition hover:bg-white/10 hover:text-white/70 group-hover:opacity-100"
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
