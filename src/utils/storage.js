import { supabase } from '../lib/supabase.js'

const STORAGE_KEY = 'mood-diary-entries-v1'
const TABLE_NAME = 'diary_entries'

function normalizeEntry(entry) {
  return {
    ...entry,
    id: entry.id || crypto.randomUUID(),
    date: entry.date || new Date().toISOString().slice(0, 10),
    createdAt: entry.createdAt || Date.now(),
    updatedAt: Date.now()
  }
}

function entryToRow(entry) {
  const normalized = normalizeEntry(entry)

  return {
    id: normalized.id,
    entry_date: normalized.date,
    data: normalized
  }
}

function rowToEntry(row) {
  const data = row.data || {}

  return normalizeEntry({
    ...data,
    id: row.id,
    date: data.date || row.entry_date,
    createdAt: data.createdAt || new Date(row.created_at).getTime()
  })
}

function loadLocalEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Не удалось прочитать старые записи из localStorage', e)
    return []
  }
}

export async function loadEntries() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, entry_date, data, created_at')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data.map(rowToEntry)
}

export async function saveEntry(entry) {
  const row = entryToRow(entry)
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(row, { onConflict: 'id' })
    .select('id, entry_date, data, created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return rowToEntry(data)
}

export async function deleteEntry(id) {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function migrateLocalEntriesToCloud(existingEntries) {
  const localEntries = loadLocalEntries()
  if (localEntries.length === 0) return []

  const existingIds = new Set(existingEntries.map((entry) => entry.id))
  const entriesToMigrate = localEntries
    .filter((entry) => entry.id && !existingIds.has(entry.id))
    .map(normalizeEntry)

  if (entriesToMigrate.length === 0) return []

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(entriesToMigrate.map(entryToRow), { onConflict: 'id' })
    .select('id, entry_date, data, created_at')

  if (error) {
    throw new Error(error.message)
  }

  return data.map(rowToEntry)
}

export function makeEmptyEntry() {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    emotions: [],
    emotionOther: '',
    intensity: null,
    anxiety: null,
    energy: null,
    productivity: null,
    social: null,
    activity: null,
    crying: '',
    dreamQuality: '',
    dreamContent: '',
    faceRedness: '',
    body: [],
    bodyOther: '',
    thoughts: '',
    events: '',
    helped: [],
    helpedOther: '',
    hardship: null,
    oneSentence: '',
    q1: '',
    q2: '',
    q3: '',
    createdAt: Date.now()
  }
}

export function exportEntriesAsJSON(entries) {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mood-diary-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
