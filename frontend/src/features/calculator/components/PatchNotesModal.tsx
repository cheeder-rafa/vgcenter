import { createPortal } from 'react-dom'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function PatchNotesModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Patch notes and known issues"
        className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-sm border border-white/10 bg-arena-void p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="arena-chip absolute right-4 top-4 cursor-pointer text-white/55 transition hover:text-white/80"
        >
          ✕
        </button>

        <h2 className="mb-1 font-display text-base font-bold tracking-wide text-white">
          VGCenter
        </h2>
        <p className="mb-5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-arena-violet">
          Patch Notes &amp; Known Issues
        </p>

        <section className="mb-6">
          <h3 className="arena-label mb-3 text-arena-plasma">What's New</h3>
          <ul className="space-y-2 text-sm text-white/75">
            <li>
              <strong className="text-white/90">Preview Coach is live.</strong>{' '}
              Pick your bring-4, analyze every opponent lead pair in Lead Lab,
              get explained team-plan recommendations, and track your BO3
              adaptation notes — all in one place.
            </li>
            <li>
              The navigation was redesigned as a minimal floating bar so the
              calculator and Preview Coach take up the full screen without
              wasted space on the sides.
            </li>
            <li>
              Damage results show the full 16-roll spread, min–max range, HP
              percentage, and KO chance simultaneously — no more toggling
              between views.
            </li>
            <li>
              Species-first input: pick a Pokémon and its types, base stats,
              abilities, and moves populate automatically.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="arena-label mb-3 text-arena-violet">Known Issues</h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li>
              A small number of item and ability interactions are still being
              verified. If a result looks off, treat it as provisional.
            </li>
            <li>
              Send feedback using the link in the calculator header so it can be
              checked against the corrections list.
            </li>
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}
