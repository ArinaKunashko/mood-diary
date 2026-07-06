function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function EntryList({ entries, onSelect, onDelete }) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>Записей пока нет.</p>
        <p className="empty-state-sub">Первая запись появится здесь, как только ты её сохранишь.</p>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <ul className="entry-list">
      {sorted.map((entry) => (
        <li key={entry.id} className="entry-card" onClick={() => onSelect(entry)}>
          <div className="entry-card-top">
            <span className="entry-card-date">{formatDate(entry.date)}</span>
            {entry.hardship !== null && (
              <span className="entry-card-badge">тяжесть {entry.hardship}/10</span>
            )}
          </div>
          {entry.oneSentence && <p className="entry-card-sentence">«{entry.oneSentence}»</p>}
          {entry.emotions.length > 0 && (
            <div className="entry-card-tags">
              {entry.emotions.slice(0, 5).map((e) => (
                <span key={e} className="mini-tag">{e}</span>
              ))}
            </div>
          )}
          <button
            type="button"
            className="entry-card-delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(entry.id)
            }}
            aria-label="Удалить запись"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
