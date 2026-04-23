import { createPortal } from 'react-dom'

type Props = {
  isOpen: boolean
  onClose: () => void
  regulation: string
}

export function PatchNotesModal({ isOpen, onClose, regulation }: Props) {
  if (!isOpen) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Regulation ${regulation} patch notes`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-sm border border-white/10 bg-arena-void p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="arena-chip absolute right-4 top-4 text-white/55 hover:text-white/80 transition"
        >
          ✕
        </button>

        <h2 className="mb-1 font-display text-base font-bold tracking-wide text-white">
          Regulation {regulation}
        </h2>
        <p className="mb-5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-arena-violet">
          Patch Notes &amp; Known Issues
        </p>

        <section className="mb-6">
          <h3 className="arena-label mb-3 text-arena-plasma">What's New</h3>
          <ul className="space-y-2 text-sm text-white/75">
            <li>
              The calculator is easier to use on phones and smaller screens.
            </li>
            <li>
              The header stays cleaner, so the branding and quick actions no
              longer crowd each other on mid-sized screens.
            </li>
            <li>
              Damage details are easier to scan during quick comparisons,
              including clearer KO coloring and matchup pins.
            </li>
            <li>
              Move-by-move damage breakdowns are easier to inspect without
              losing your place in the matchup.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="arena-label mb-3 text-arena-violet">Known Issues</h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li>
              Some items, abilities, and damage calculations are still under
              correction, so a few matchups may read incorrectly while this pass
              is being cleaned up.
            </li>
            <li>
              If a result looks off, treat it as provisional and send feedback
              so it can be checked against the current corrections list.
            </li>
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}
