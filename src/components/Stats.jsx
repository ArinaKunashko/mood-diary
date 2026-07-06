import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { EMOTION_VALENCE, CRYING_LEVEL } from '../data/options.js'

// Настроение = средний знак выбранных эмоций (от -1 до 1) * сила эмоций (0-5).
// Получается число от -5 (сильные негативные эмоции) до +5 (сильные позитивные).
function moodScore(entry) {
  if (!entry.emotions || entry.emotions.length === 0 || entry.intensity === null) return null
  const avgValence =
    entry.emotions.reduce((sum, e) => sum + (EMOTION_VALENCE[e] ?? 0), 0) / entry.emotions.length
  return Math.round(avgValence * entry.intensity * 10) / 10
}

const CRYING_COLORS = ['#E8E2D6', '#CBD6D0', '#A9C2B6', '#7C9885', '#5F7A68']

export default function Stats({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>Пока нет данных для графика.</p>
        <p className="empty-state-sub">Сделай пару записей — и здесь появится динамика.</p>
      </div>
    )
  }

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))

  const data = sortedEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    Тревога: e.anxiety,
    Энергия: e.energy,
    'Сила эмоций': e.intensity,
    'Тяжесть (÷2)': e.hardship !== null ? Math.round((e.hardship / 2) * 10) / 10 : null
  }))

  const moodData = sortedEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    Настроение: moodScore(e)
  }))

  return (
    <div className="stats-block">
      <h3>Динамика по записям</h3>
      <p className="section-hint">
        Шкалы 0–5, «Тяжесть» приведена к той же шкале (исходно 0–10) для наглядности.
      </p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12} />
            <YAxis domain={[0, 5]} stroke="var(--color-text-soft)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontFamily: 'var(--font-body)'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="Тревога" stroke="#A08CB3" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Энергия" stroke="#7C9885" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Сила эмоций" stroke="#D98B7A" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Тяжесть (÷2)" stroke="#8C8375" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ marginTop: 28 }}>Настроение (знак + сила эмоций)</h3>
      <p className="section-hint">
        Не путать с «Силой эмоций» выше: здесь учитывается ещё и знак — позитивные эмоции
        дают плюс, негативные — минус. От −5 (сильный минус) до +5 (сильный плюс).
      </p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={moodData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12} />
            <YAxis domain={[-5, 5]} stroke="var(--color-text-soft)" fontSize={12} />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontFamily: 'var(--font-body)'
              }}
            />
            <Line type="monotone" dataKey="Настроение" stroke="#7C9885" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ marginTop: 28 }}>Плач по дням</h3>
      <p className="section-hint">Наведи на точку, чтобы увидеть дату и степень.</p>
      <div className="crying-strip">
        {sortedEntries.map((e) => {
          const level = CRYING_LEVEL[e.crying] ?? null
          const label = new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
          return (
            <div
              key={e.id}
              className="crying-dot"
              style={{ background: level === null ? '#F0EDE6' : CRYING_COLORS[level] }}
              title={`${label} — ${e.crying || 'не указано'}`}
            />
          )
        })}
      </div>
    </div>
  )
}
