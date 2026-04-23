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
              <span className="mr-2 font-mono text-[0.65rem] tracking-widest text-white/35">
                #33
              </span>
              Selective damage recompute now avoids rerunning every calc when a
              stat change only affects one side or no damage rolls at all.
            </li>
            <li>
              <span className="mr-2 font-mono text-[0.65rem] tracking-widest text-white/35">
                #33
              </span>
              Mini move heatmaps stay visible even with empty slots so both
              Pokemon panels keep their headers aligned.
            </li>
            <li>
              <span className="mr-2 font-mono text-[0.65rem] tracking-widest text-white/35">
                #33
              </span>
              Speed ribbon labels were rebuilt to stay readable and move rows
              now show delta chips after each side-specific edit.
            </li>
            <li>
              <span className="mr-2 font-mono text-[0.65rem] tracking-widest text-white/35">
                #32
              </span>
              Current HP, low-HP thresholds, resist berries, Mold Breaker
              bypasses, and other direct damage interactions are now part of
              the live calc baseline.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="arena-label mb-3 text-arena-violet">Known Issues</h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li className="italic">— No known issues at this time. —</li>
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}
