export default function MultiSelect({ label, options, selected, onToggle, otherValue, onOtherChange, singleChoice = false }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
      </div>
      <div className="pill-row">
        {options.map((opt) => {
          const isActive = selected.includes(opt)
          return (
            <button
              type="button"
              key={opt}
              className={`pill ${isActive ? 'is-active' : ''}`}
              onClick={() => onToggle(opt)}
              aria-pressed={isActive}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {onOtherChange && (
        <input
          type="text"
          className="text-input other-input"
          placeholder="Другое…"
          value={otherValue || ''}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      )}
    </div>
  )
}
