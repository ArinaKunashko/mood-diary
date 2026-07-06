const STORAGE_KEY = 'mood-diary-entries-v1'

export function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Не удалось прочитать записи из localStorage', e)
    return []
  }
}

export function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch (e) {
    console.error('Не удалось сохранить записи в localStorage', e)
    return false
  }
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
