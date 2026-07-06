import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { EMOTION_VALENCE, CRYING_LEVEL, DREAM_LEVEL, FACE_REDNESS_LEVEL } from '../data/options.js'

// Настроение = средний знак выбранных эмоций (от -1 до 1) * сила эмоций (0-5).
// Получается число от -5 (сильные негативные эмоции) до +5 (сильные позитивные).
function moodScore(entry) {
  if (!entry.emotions || entry.emotions.length === 0 || entry.intensity === null) return null
  const avgValence =
    entry.emotions.reduce((sum, e) => sum + (EMOTION_VALENCE[e] ?? 0), 0) / entry.emotions.length
  return Math.round(avgValence * entry.intensity * 10) / 10
}

const CRYING_COLORS = ['#E8E2D6', '#CBD6D0', '#A9C2B6', '#7C9885', '#5F7A68']
const DREAM_COLORS = {
  calm: '#7C9885',
  anxious: '#A08CB3',
  unknown: '#F0EDE6'
}

function PrettyTooltip({ active, payload, label, type }) {
  if (!active || !payload || payload.length === 0) return null

  const visiblePayload = payload.filter((item) => item.value !== null && item.value !== undefined)
  if (visiblePayload.length === 0) return null

  const firstPayload = visiblePayload[0]?.payload || {}

  if (type === 'description') {
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-date">{label}</div>
        <div className="chart-tooltip-row">
          <span>{visiblePayload[0].name}</span>
          <strong>{firstPayload.description || 'не указано'}</strong>
        </div>
        {firstPayload.note && <div className="chart-tooltip-note">{firstPayload.note}</div>}
      </div>
    )
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{label}</div>
      {visiblePayload.map((item) => (
        <div key={item.dataKey} className="chart-tooltip-row">
          <span>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

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
    Энергия: e.energy
  }))

  const moodData = sortedEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    Настроение: moodScore(e)
  }))

  const faceRednessData = sortedEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    'Покраснение лица': FACE_REDNESS_LEVEL[e.faceRedness] ?? null,
    description: e.faceRedness || 'не указано'
  }))

  const dreamData = sortedEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    'Тревожность сна': DREAM_LEVEL[e.dreamQuality] ?? null,
    description: e.dreamQuality || 'не указано'
  }))

  const cryingData = sortedEntries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    Плач: CRYING_LEVEL[e.crying] ?? null,
    description: e.crying || 'не указано',
    color: CRYING_COLORS[CRYING_LEVEL[e.crying]] || '#F0EDE6'
  }))

  return (
    <div className="stats-block">
      <h3>Динамика по записям</h3>
      <p className="section-hint">Шкалы 0–5: тревога и энергия.</p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12} />
            <YAxis domain={[0, 5]} stroke="var(--color-text-soft)" fontSize={12} />
            <Tooltip content={<PrettyTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="Тревога" stroke="#A08CB3" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Энергия" stroke="#7C9885" strokeWidth={2} dot={{ r: 3 }} connectNulls />
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
            <Tooltip content={<PrettyTooltip />} />
            <Line type="monotone" dataKey="Настроение" stroke="#7C9885" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ marginTop: 28 }}>Сон</h3>
      <p className="section-hint">
        0 — не тревожный сон, 1 — тревожный сон. «Не помню» остаётся без точки на графике.
      </p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={dreamData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12} />
            <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="var(--color-text-soft)" fontSize={12} />
            <Tooltip content={<PrettyTooltip type="description" />} />
            <Line type="stepAfter" dataKey="Тревожность сна" stroke="#A08CB3" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="crying-strip">
        {sortedEntries.map((e) => {
          const level = DREAM_LEVEL[e.dreamQuality]
          const label = new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
          const background =
            level === 0 ? DREAM_COLORS.calm : level === 1 ? DREAM_COLORS.anxious : DREAM_COLORS.unknown
          return (
            <div
              key={e.id}
              className="crying-dot has-tooltip"
              style={{ background }}
              data-tooltip={`${label} — ${e.dreamQuality || 'не указано'}${e.dreamContent ? `: ${e.dreamContent}` : ''}`}
            />
          )
        })}
      </div>

      <h3 style={{ marginTop: 28 }}>Покраснение лица</h3>
      <p className="section-hint">
        0 — не краснело, 1 — немного, 2 — сильно, 3 — краснело и зудело,
        4 — краснело и болело, 5 — краснело, зудело и болело.
      </p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={faceRednessData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12} />
            <YAxis domain={[0, 5]} stroke="var(--color-text-soft)" fontSize={12} />
            <Tooltip content={<PrettyTooltip type="description" />} />
            <Line type="monotone" dataKey="Покраснение лица" stroke="#C75F4E" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ marginTop: 28 }}>Плач по дням</h3>
      <p className="section-hint">
        0 — не плакала, 1 — хотелось плакать, 2 — немного, 3 — долго, 4 — не могла остановиться.
      </p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cryingData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12} />
            <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} stroke="var(--color-text-soft)" fontSize={12} />
            <Tooltip content={<PrettyTooltip type="description" />} cursor={{ fill: 'rgba(124, 152, 133, 0.08)' }} />
            <Bar dataKey="Плач" radius={[6, 6, 0, 0]} minPointSize={4}>
              {cryingData.map((entry, index) => (
                <Cell key={`${entry.date}-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="symptom-legend">
        {['Не плакала', 'Хотелось плакать', 'Немного плакала', 'Долго плакала', 'Не могла остановиться'].map((label) => (
          <span key={label}>
            <i style={{ background: CRYING_COLORS[CRYING_LEVEL[label]] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
