import { useEffect, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import EntryList from './components/EntryList.jsx'
import EntryDetail from './components/EntryDetail.jsx'
import Stats from './components/Stats.jsx'
import { loadEntries, saveEntries, makeEmptyEntry, exportEntriesAsJSON } from './utils/storage.js'

const TABS = [
  { id: 'new', label: 'Новая запись' },
  { id: 'history', label: 'История' },
  { id: 'stats', label: 'Статистика' }
]

export default function App() {
  const [entries, setEntries] = useState([])
  const [tab, setTab] = useState('new')
  const [draft, setDraft] = useState(() => makeEmptyEntry())
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  const persist = (next) => {
    setEntries(next)
    saveEntries(next)
  }

  const handleSaveNew = (entry) => {
    persist([...entries, entry])
    setDraft(makeEmptyEntry())
    setTab('history')
  }

  const handleSaveEdit = (entry) => {
    persist(entries.map((e) => (e.id === entry.id ? entry : e)))
    setEditingEntry(null)
    setSelectedEntry(entry)
  }

  const handleDelete = (id) => {
    if (!confirm('Удалить эту запись? Это действие нельзя отменить.')) return
    persist(entries.filter((e) => e.id !== id))
    if (selectedEntry?.id === id) setSelectedEntry(null)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <h1>🌿 Дневник состояния</h1>
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'is-active' : ''}`}
                onClick={() => {
                  setTab(t.id)
                  setSelectedEntry(null)
                  setEditingEntry(null)
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {tab === 'new' && (
          <EntryForm
            key="new-form"
            initialEntry={draft}
            onSave={handleSaveNew}
          />
        )}

        {tab === 'history' && !selectedEntry && !editingEntry && (
          <>
            <div className="history-toolbar">
              <span className="history-count">
                {entries.length} {entries.length === 1 ? 'запись' : 'записей'}
              </span>
              {entries.length > 0 && (
                <button className="btn btn-ghost btn-small" onClick={() => exportEntriesAsJSON(entries)}>
                  Экспорт в JSON
                </button>
              )}
            </div>
            <EntryList entries={entries} onSelect={setSelectedEntry} onDelete={handleDelete} />
          </>
        )}

        {tab === 'history' && selectedEntry && !editingEntry && (
          <EntryDetail
            entry={selectedEntry}
            onEdit={() => setEditingEntry(selectedEntry)}
            onClose={() => setSelectedEntry(null)}
          />
        )}

        {tab === 'history' && editingEntry && (
          <EntryForm
            key={editingEntry.id}
            initialEntry={editingEntry}
            onSave={handleSaveEdit}
            onCancel={() => setEditingEntry(null)}
          />
        )}

        {tab === 'stats' && <Stats entries={entries} />}
      </main>

      <footer className="app-footer">
        <p>Все записи хранятся только в этом браузере (localStorage) — никуда не отправляются.</p>
      </footer>
    </div>
  )
}
