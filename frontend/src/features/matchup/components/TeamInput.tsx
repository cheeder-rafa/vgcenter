type Props = {
  label: string
  value: string
  onChange: (v: string) => void
  onImport: () => void
  imported: boolean
  loading: boolean
  teamLabels: string[]
}

export function TeamInput({ label, value, onChange, onImport, imported, loading, teamLabels }: Props) {
  return (
    <div className="space-y-2">
      <label className="arena-label block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste Showdown export or Pokepaste URL here…"
        rows={6}
        className="arena-input w-full resize-none font-mono text-xs"
        aria-label={`${label} team Showdown export or Pokepaste URL`}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onImport}
          disabled={loading || !value.trim()}
          className="arena-chip disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Importing…' : 'Import Team'}
        </button>
        {imported && teamLabels.length > 0 && (
          <span className="font-body text-[0.65rem] text-arena-cyan/80">
            {teamLabels.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}
