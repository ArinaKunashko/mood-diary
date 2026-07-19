import { supabase } from '../lib/supabase.js'

const STORAGE_KEY = 'mood-diary-entries-v1'
const CACHE_KEY = 'mood-diary-cloud-cache-v1'
const TREATMENT_CACHE_KEY = 'mood-diary-treatment-cache-v1'
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

function isTreatmentRow(row) {
  return row.data?.recordType === 'treatment'
}

function normalizeTreatmentRecord(record) {
  const kind = record.kind === 'medication' ? 'psychiatrist' : record.kind || 'psychiatrist'
  const notesList = Array.isArray(record.notesList)
    ? record.notesList
    : String(record.notes || '').trim()
      ? [String(record.notes).trim()]
      : []
  const medications = Array.isArray(record.medications)
    ? record.medications
        .map((item) => ({
          name: String(item.name || '').trim(),
          dosage: String(item.dosage || '').trim()
        }))
        .filter((item) => item.name || item.dosage)
    : record.medication || record.dosage
      ? [{ name: record.medication || '', dosage: record.dosage || '' }]
      : []

  return {
    ...record,
    id: record.id || crypto.randomUUID(),
    recordType: 'treatment',
    date: record.date || new Date().toISOString().slice(0, 10),
    kind,
    title: record.title || '',
    specialist: record.specialist || '',
    medication: medications[0]?.name || '',
    dosage: medications[0]?.dosage || '',
    medications,
    notes: record.notes || '',
    notesList,
    followUp: record.followUp || '',
    planned: Boolean(record.planned),
    createdAt: record.createdAt || Date.now(),
    updatedAt: Date.now()
  }
}

function treatmentRecordToRow(record) {
  const normalized = normalizeTreatmentRecord(record)

  return {
    id: normalized.id,
    entry_date: normalized.date,
    data: normalized
  }
}

function rowToTreatmentRecord(row) {
  const data = row.data || {}

  return normalizeTreatmentRecord({
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

export function loadCachedEntries() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return loadLocalEntries()

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : []
  } catch (e) {
    console.error('Не удалось прочитать кэш записей', e)
    return loadLocalEntries()
  }
}

export function loadCachedTreatmentRecords() {
  try {
    const raw = localStorage.getItem(TREATMENT_CACHE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(normalizeTreatmentRecord) : []
  } catch (e) {
    console.error('Не удалось прочитать кэш лечения', e)
    return []
  }
}

export function cacheEntries(entries) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries.map(normalizeEntry)))
    return true
  } catch (e) {
    console.error('Не удалось обновить кэш записей', e)
    return false
  }
}

export function cacheTreatmentRecords(records) {
  try {
    localStorage.setItem(TREATMENT_CACHE_KEY, JSON.stringify(records.map(normalizeTreatmentRecord)))
    return true
  } catch (e) {
    console.error('Не удалось обновить кэш лечения', e)
    return false
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

  return data.filter((row) => !isTreatmentRow(row)).map(rowToEntry)
}

export async function loadTreatmentRecords() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, entry_date, data, created_at')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data.filter(isTreatmentRow).map(rowToTreatmentRecord)
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

export async function saveTreatmentRecord(record) {
  const row = treatmentRecordToRow(record)
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(row, { onConflict: 'id' })
    .select('id, entry_date, data, created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return rowToTreatmentRecord(data)
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

export const deleteTreatmentRecord = deleteEntry

export function makeEmptyTreatmentRecord() {
  return normalizeTreatmentRecord({})
}

export const DEFAULT_TREATMENT_RECORDS = [
  {
    id: 'treatment-2026-05-23-psychiatrist-first',
    date: '2026-05-23',
    kind: 'psychiatrist',
    title: 'Первый прием психиатра',
    specialist: 'Психиатр',
    notes: 'Первый прием перед началом лечения.',
    followUp: ''
  },
  {
    id: 'treatment-2026-05-24-duloxetine-30',
    date: '2026-05-24',
    kind: 'psychiatrist',
    title: 'Начала Дулоксенту',
    specialist: 'Психиатр',
    medication: 'Дулоксента',
    dosage: '30 мг',
    notes: 'Начало приема.',
    followUp: ''
  },
  {
    id: 'treatment-2026-06-27-psychiatrist-second',
    date: '2026-06-27',
    kind: 'psychiatrist',
    title: 'Второй прием психиатра',
    specialist: 'Психиатр',
    notes: 'Обсудили лечение и повышение дозировки.',
    followUp: ''
  },
  {
    id: 'treatment-2026-06-28-duloxetine-60',
    date: '2026-06-28',
    kind: 'psychiatrist',
    title: 'Повысили дозировку Дулоксенты',
    specialist: 'Психиатр',
    medication: 'Дулоксента',
    dosage: '60 мг',
    notes: 'Повышение дозировки.',
    followUp: ''
  },
  {
    id: 'treatment-2026-08-22-psychiatrist-planned',
    date: '2026-08-22',
    kind: 'psychiatrist',
    title: 'Следующий прием психиатра',
    specialist: 'Психиатр',
    notes: 'Запланированный прием.',
    followUp: '',
    planned: true
  }
].map(normalizeTreatmentRecord)

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
    cycleDay: '',
    morningMood: null,
    eveningMood: null,
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
    sleepLatency: '',
    sleepHours: '',
    dreamContent: '',
    faceRedness: '',
    faceRednessReason: '',
    body: [],
    bodyOther: '',
    thoughts: '',
    events: '',
    helped: [],
    helpedOther: '',
    hardship: null,
    oneSentence: '',
    q1: '',
    needs: [],
    needsOther: '',
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
