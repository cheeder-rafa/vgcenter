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
              Damage Plan mode lets you chain multi-turn lines instead of only
              looking at isolated single-hit calcs.
            </li>
            <li>
              Small delta chips now sit beside each move so edits are easier to
              compare at a glance.
            </li>
            <li>
              The previous direct-damage corrections pass now covers Mystic
              Water, Levitate, Mold Breaker, and the new item and ability
              interactions more faithfully.
            </li>
            <li>
              The calculator stays reactive, so weather, terrain, and field
              changes update the line without a manual calculate step.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="arena-label mb-3 text-arena-violet">Known Issues</h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li>
              If a result looks off, treat it as provisional and send feedback
              so it can be checked against the current corrections list.
            </li>
            <li>
              Damage Plan mode is a line-building aid, not a full battle engine,
              so keep an eye on field changes when sequencing turns.
            </li>
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}
