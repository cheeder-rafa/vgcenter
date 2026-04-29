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
              <strong className="text-white/90">Tuesday, April 28, 2026.</strong>{' '}
              Replay Autopsy fixes shipped on <em>/replay</em>: parser edge
              cases (including weather/status handling) are corrected, player
              selector behavior is more reliable, and evaluation flow is more
              stable.
            </li>
            <li>
              <strong className="text-white/90">Monday, April 27, 2026.</strong>{' '}
              Replay Autopsy backend is live end-to-end: import a Showdown
              replay and evaluate decision quality turn by turn.
            </li>
            <li>
              <strong className="text-white/90">Friday, April 25, 2026.</strong>{' '}
              Multi-threat spread optimization launched in <em>/calc</em>. You
              can pin threats and optimize one spread using expected damage,
              worst-case KO chance, or survive-all goals.
            </li>
            <li>
              <strong className="text-white/90">Thursday, April 24, 2026.</strong>{' '}
              Preview Coach updates: field controls are shared across Lead Lab
              and Team Plan, damage evidence appears in drilldowns, and "Open in
              Calculator" now carries matchup + field context directly to{' '}
              <em>/calc</em>.
            </li>
            <li>
              <strong className="text-white/90">Wednesday, April 23, 2026.</strong>{' '}
              Team plans are clearer: smarter support/mega weighting, better
              "Handles well" detection, clearer win-condition placement, and
              cleaner read-difficulty copy.
            </li>
            <li>
              <strong className="text-white/90">Tuesday, April 22, 2026.</strong>{' '}
              Performance pass: recommendation generation and replay evaluation
              were optimized to reduce wait time and smooth large analyses.
            </li>
            <li>
              <strong className="text-white/90">Monday, April 21, 2026.</strong>{' '}
              Speed Tier Sheet and Preview Coach are live, plus damage results
              now show full roll detail (16 rolls, min/max %, and KO odds)
              without extra toggles.
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
            <li>Send feedback using the button in the top navigation bar.</li>
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}
