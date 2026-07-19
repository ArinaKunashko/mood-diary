import { useEffect, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import EntryList from './components/EntryList.jsx'
import EntryDetail from './components/EntryDetail.jsx'
import PinGate, { clearSavedAccess, hasSavedAccess } from './components/PinGate.jsx'
import Stats from './components/Stats.jsx'
import TreatmentRecords from './components/TreatmentRecords.jsx'
import {
  cacheEntries,
  cacheTreatmentRecords,
  deleteEntry,
  deleteTreatmentRecord,
  DEFAULT_TREATMENT_RECORDS,
  exportEntriesAsJSON,
  loadCachedEntries,
  loadCachedTreatmentRecords,
  loadEntries,
  loadTreatmentRecords,
  makeEmptyEntry,
  migrateLocalEntriesToCloud,
  saveEntry,
  saveTreatmentRecord
} from './utils/storage.js'

const TABS = [
  { id: 'new', label: 'Новая запись' },
  { id: 'history', label: 'История' },
  { id: 'stats', label: 'Статистика' },
  { id: 'treatment', label: 'Лечение' }
]

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => hasSavedAccess())
  const [entries, setEntries] = useState([])
  const [treatmentRecords, setTreatmentRecords] = useState([])
  const [tab, setTab] = useState('new')
  const [draft, setDraft] = useState(() => makeEmptyEntry())
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isUnlocked) return

    async function initializeEntries() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [cloudEntries, cloudTreatmentRecords] = await Promise.all([
          loadEntries(),
          loadTreatmentRecords()
        ])
        const migratedEntries = await migrateLocalEntriesToCloud(cloudEntries)
        const nextEntries = [...cloudEntries, ...migratedEntries]
        let nextTreatmentRecords = cloudTreatmentRecords

        setEntries(nextEntries)
        cacheEntries(nextEntries)
        if (nextTreatmentRecords.length === 0) {
          const seededRecords = await Promise.all(DEFAULT_TREATMENT_RECORDS.map(saveTreatmentRecord))
          nextTreatmentRecords = seededRecords
        }
        setTreatmentRecords(nextTreatmentRecords)
        cacheTreatmentRecords(nextTreatmentRecords)
        if (migratedEntries.length > 0) {
          setStatusMessage(`Перенесено в облако: ${migratedEntries.length} записей`)
        } else {
          setStatusMessage('')
        }
      } catch (e) {
        const cachedEntries = loadCachedEntries()
        const cachedTreatmentRecords = loadCachedTreatmentRecords()
        if (cachedEntries.length > 0) {
          setEntries(cachedEntries)
          setTreatmentRecords(cachedTreatmentRecords)
          setStatusMessage('Показаны записи из локального кэша. Когда интернет вернётся, дневник снова подключится к Supabase.')
          setErrorMessage(`Не удалось подключиться к Supabase: ${e.message}`)
        } else {
          setErrorMessage(`Не удалось подключиться к Supabase, а локальный кэш пока пуст: ${e.message}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeEntries()
  }, [isUnlocked])

  const handleLogout = () => {
    clearSavedAccess()
    setIsUnlocked(false)
    setEntries([])
    setTreatmentRecords([])
    setSelectedEntry(null)
    setEditingEntry(null)
    setStatusMessage('')
    setErrorMessage('')
  }

  const persistEntry = async (entry) => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const savedEntry = await saveEntry(entry)
      setEntries((current) => {
        const exists = current.some((item) => item.id === savedEntry.id)
        const nextEntries = exists
          ? current.map((item) => (item.id === savedEntry.id ? savedEntry : item))
          : [...current, savedEntry]
        cacheEntries(nextEntries)
        return nextEntries
      })
      setStatusMessage('Запись сохранена в Supabase')
      return savedEntry
    } catch (e) {
      setErrorMessage(`Не удалось сохранить запись: ${e.message}`)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNew = async (entry) => {
    const savedEntry = await persistEntry(entry)
    if (!savedEntry) return

    setDraft(makeEmptyEntry())
    setTab('history')
  }

  const handleSaveEdit = async (entry) => {
    const savedEntry = await persistEntry(entry)
    if (!savedEntry) return

    setEditingEntry(null)
    setSelectedEntry(savedEntry)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить эту запись? Это действие нельзя отменить.')) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      await deleteEntry(id)
      setEntries((current) => {
        const nextEntries = current.filter((e) => e.id !== id)
        cacheEntries(nextEntries)
        return nextEntries
      })
      if (selectedEntry?.id === id) setSelectedEntry(null)
      setStatusMessage('Запись удалена из Supabase')
    } catch (e) {
      setErrorMessage(`Не удалось удалить запись: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const persistTreatmentRecord = async (record) => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const savedRecord = await saveTreatmentRecord(record)
      setTreatmentRecords((current) => {
        const exists = current.some((item) => item.id === savedRecord.id)
        const nextRecords = exists
          ? current.map((item) => (item.id === savedRecord.id ? savedRecord : item))
          : [...current, savedRecord]
        cacheTreatmentRecords(nextRecords)
        return nextRecords
      })
      setStatusMessage('Запись лечения сохранена в Supabase')
      return savedRecord
    } catch (e) {
      setErrorMessage(`Не удалось сохранить запись лечения: ${e.message}`)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTreatmentRecord = async (id) => {
    if (!confirm('Удалить эту запись лечения?')) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      await deleteTreatmentRecord(id)
      setTreatmentRecords((current) => {
        const nextRecords = current.filter((record) => record.id !== id)
        cacheTreatmentRecords(nextRecords)
        return nextRecords
      })
      setStatusMessage('Запись лечения удалена из Supabase')
    } catch (e) {
      setErrorMessage(`Не удалось удалить запись лечения: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    !isUnlocked ? (
      <PinGate onUnlock={() => setIsUnlocked(true)} />
    ) : (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-top">
            <h1>🌿 Дневник состояния</h1>
            <button type="button" className="btn btn-ghost btn-small" onClick={handleLogout}>
              Выйти
            </button>
          </div>
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
          <div className="cloud-status" aria-live="polite">
            {isLoading ? 'Подключаюсь к Supabase...' : errorMessage ? 'Открыт локальный кэш' : 'Облачное сохранение включено'}
          </div>
        </div>
      </header>

      <main className="app-main">
        {errorMessage && <div className="notice notice-error">{errorMessage}</div>}
        {statusMessage && <div className={`notice ${errorMessage ? 'notice-warning' : 'notice-success'}`}>{statusMessage}</div>}
        {isLoading && (
          <div className="empty-state">
            <p>Загружаю записи из Supabase...</p>
          </div>
        )}

        {!isLoading && tab === 'new' && (
          <EntryForm
            key="new-form"
            initialEntry={draft}
            entries={entries}
            onSave={handleSaveNew}
            isSaving={isSaving}
          />
        )}

        {!isLoading && tab === 'history' && !selectedEntry && !editingEntry && (
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

        {!isLoading && tab === 'history' && selectedEntry && !editingEntry && (
          <EntryDetail
            entry={selectedEntry}
            onEdit={() => setEditingEntry(selectedEntry)}
            onClose={() => setSelectedEntry(null)}
          />
        )}

        {!isLoading && tab === 'history' && editingEntry && (
          <EntryForm
            key={editingEntry.id}
            initialEntry={editingEntry}
            entries={entries}
            onSave={handleSaveEdit}
            onCancel={() => setEditingEntry(null)}
            isSaving={isSaving}
          />
        )}

        {!isLoading && tab === 'stats' && <Stats entries={entries} treatmentRecords={treatmentRecords} />}

        {!isLoading && tab === 'treatment' && (
          <TreatmentRecords
            records={treatmentRecords}
            onSave={persistTreatmentRecord}
            onDelete={handleDeleteTreatmentRecord}
            isSaving={isSaving}
          />
        )}
      </main>

      <footer className="app-footer">
        <blockquote className="footer-quote">
          <p>«..не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой; Я укреплю тебя, и помогу тебе, и поддержу тебя десницею правды Моей»</p>
          <cite>Исаия 41:10</cite>
        </blockquote>
      </footer>
    </div>
    )
  )
}
