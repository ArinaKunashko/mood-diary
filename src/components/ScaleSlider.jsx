export default function ScaleSlider({ label, value, onChange, max = 5, labels }) {
  const steps = Array.from({ length: max + 1 }, (_, i) => i)

  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="field-score">{value === null ? '—' : `${value} / ${max}`}</span>
      </div>
      <div className="scale-row">
        {steps.map((n) => (
          <button
            type="button"
            key={n}
            className={`scale-dot ${value === n ? 'is-active' : ''}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            aria-label={`${n}${labels && labels[n] ? ` — ${labels[n]}` : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
      {labels && value !== null && <p className="field-hint">{labels[value]}</p>}
    </div>
  )
}
