import { useState } from 'react'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function monthLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function monthKey(dateStr) {
  return dateStr?.slice(0, 7) || 'no-date'
}

function EntryCard({ entry, onSelect, onDelete }) {
  return (
    <li className="entry-card" onClick={() => onSelect(entry)}>
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
  )
}

export default function EntryList({ entries, onSelect, onDelete }) {
  const [openMonths, setOpenMonths] = useState({})

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>Записей пока нет.</p>
        <p className="empty-state-sub">Первая запись появится здесь, как только ты её сохранишь.</p>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)
  const latestEntries = sorted.slice(0, 2)
  const groupedEntries = sorted.slice(2).reduce((groups, entry) => {
    const key = monthKey(entry.date)
    if (!groups[key]) {
      groups[key] = {
        key,
        label: monthLabel(entry.date),
        entries: []
      }
    }
    groups[key].entries.push(entry)
    return groups
  }, {})

  const monthGroups = Object.values(groupedEntries)

  const toggleMonth = (key) => {
    setOpenMonths((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="entry-history">
      <section className="entry-history-latest">
        <h3>Последние записи</h3>
        <ul className="entry-list">
          {latestEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onSelect={onSelect} onDelete={onDelete} />
          ))}
        </ul>
      </section>

      {monthGroups.length > 0 && (
        <div className="entry-months">
          {monthGroups.map((group) => {
            const isOpen = Boolean(openMonths[group.key])
            return (
              <section key={group.key} className="entry-month-group">
                <button
                  type="button"
                  className="entry-month-toggle"
                  onClick={() => toggleMonth(group.key)}
                  aria-expanded={isOpen}
                >
                  <span>{group.label}</span>
                  <em>{group.entries.length} {group.entries.length === 1 ? 'запись' : 'записей'}</em>
                  <i aria-hidden="true">{isOpen ? 'Свернуть' : 'Раскрыть'}</i>
                </button>

                {isOpen && (
                  <ul className="entry-list entry-month-list">
                    {group.entries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} onSelect={onSelect} onDelete={onDelete} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
