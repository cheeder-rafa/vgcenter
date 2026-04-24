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
              <strong className="text-white/90">Smarter team plans.</strong>{' '}
              Recommendations now prioritise your Mega Evolution and reward
              Pokémon with support moves (Tailwind, screens, redirection, Fake
              Out, etc.) — teams that enable your win condition score higher.
            </li>
            <li>
              <strong className="text-white/90">
                Better "Handles well" lists.
              </strong>{' '}
              Each plan card now shows the opponent leads your lead pair
              genuinely threatens — matchups where you also take serious damage
              back are no longer counted as handled.
            </li>
            <li>
              <strong className="text-white/90">Win condition clarity.</strong>{' '}
              The plan cards now tell you whether your chosen win condition is
              leading (exposed early), in the back (set up to close), or left on
              the bench by this plan.
            </li>
            <li>
              <strong className="text-white/90">Read difficulty</strong> (formerly
              "Prediction burden") now shows a brief explanation of what the
              rating means so it's clear at a glance.
            </li>
            <li>
              Plan cards are now the same height in every row, with the "Use
              this plan" button always anchored to the bottom.
            </li>
            <li>
              <strong className="text-white/90">Preview Coach is live.</strong>{' '}
              Lead Lab, team-plan recommendations, and BO3 adaptation notes all
              in one place.
            </li>
            <li>
              Damage results show the full 16-roll spread, min–max range, HP
              percentage, and KO chance simultaneously — no toggling.
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
              Send feedback using the button in the top navigation bar.
            </li>
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}
