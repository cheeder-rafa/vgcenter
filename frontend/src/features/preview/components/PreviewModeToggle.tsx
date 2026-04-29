import { usePreviewModeStore, type PreviewMode } from '../store/usePreviewModeStore'

const OPTIONS: { value: PreviewMode; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Beginner', hint: 'Plain-English summaries; details collapsed' },
  { value: 'expert', label: 'Expert', hint: 'Full numbers and panels expanded' },
]

export function PreviewModeToggle() {
  const mode = usePreviewModeStore((s) => s.mode)
  const setMode = usePreviewModeStore((s) => s.setMode)

  return (
    <div
      role="radiogroup"
      aria-label="Preview mode"
      className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => setMode(opt.value)}
            className={
              active
                ? 'rounded-md bg-amber-500 px-3 py-1 font-semibold text-slate-900'
                : 'rounded-md px-3 py-1 text-slate-300 hover:text-slate-100'
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
