import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  CRYING_LEVEL,
  DREAM_LEVEL,
  FACE_REDNESS_LEVEL,
  SLEEP_LATENCY_LEVEL,
  SLEEP_LATENCY_OPTIONS
} from '../data/options.js'

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function cycleLabel(entry) {
  const day = numberOrNull(entry.cycleDay)
  return day ? `${day} день цикла` : 'день цикла не указан'
}

function dateInfo(date) {
  const value = new Date(date)
  const shortDate = value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const weekday = value.toLocaleDateString('ru-RU', { weekday: 'long' })
  const shortWeekday = value.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '')

  return {
    shortDate,
    weekday,
    shortWeekday,
    fullLabel: `${weekday}, ${shortDate}`
  }
}

function parseEntryDate(date) {
  return new Date(`${date}T00:00:00`)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date, months) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function startOfWeek(date) {
  const next = new Date(date)
  const day = next.getDay() || 7
  next.setDate(next.getDate() - day + 1)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function periodRange(mode, anchorDate) {
  if (mode === 'all') return null

  if (mode === 'week') {
    const start = startOfWeek(anchorDate)
    return { start, end: addDays(start, 7) }
  }

  const start = startOfMonth(anchorDate)
  return { start, end: addMonths(start, 1) }
}

function periodTitle(mode, anchorDate) {
  if (mode === 'all') return 'Все записи'

  const range = periodRange(mode, anchorDate)
  const start = range.start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const endDate = addDays(range.end, -1)
  const end = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

  if (mode === 'week') return `${start} — ${end}`

  return range.start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function aggregateTextEntries(entries, field) {
  const grouped = new Map()

  entries.forEach((entry) => {
    const text = normalizeText(entry[field])
    if (!text) return

    const key = text.toLowerCase()
    const date = dateInfo(entry.date)
    const existing = grouped.get(key)
    const occurrence = `${date.fullLabel}, ${cycleLabel(entry)}`

    if (existing) {
      existing.count += 1
      existing.dates.push(occurrence)
      return
    }

    grouped.set(key, {
      text,
      count: 1,
      dates: [occurrence]
    })
  })

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'ru'))
}

function aggregateNeedsEntries(entries) {
  const grouped = new Map()

  entries.forEach((entry) => {
    const values = [
      ...(Array.isArray(entry.needs) ? entry.needs : []),
      normalizeText(entry.needsOther || entry.q2)
    ].filter(Boolean)

    values.forEach((text) => {
      const key = text.toLowerCase()
      const date = dateInfo(entry.date)
      const occurrence = `${date.fullLabel}, ${cycleLabel(entry)}`
      const existing = grouped.get(key)

      if (existing) {
        existing.count += 1
        existing.dates.push(occurrence)
        return
      }

      grouped.set(key, {
        text,
        count: 1,
        dates: [occurrence]
      })
    })
  })

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'ru'))
}

const CRYING_COLORS = ['#E8E2D6', '#CBD6D0', '#A9C2B6', '#7C9885', '#5F7A68']
const DREAM_COLORS = {
  calm: '#7C9885',
  uneasy: '#D6A65F',
  anxious: '#A08CB3',
  unknown: '#F0EDE6'
}
const SLEEP_LATENCY_COLORS = ['#7C9885',  '#A08CB3', '#D98B7A',]
const FACE_REDNESS_COLORS = ['#F0EDE6', '#F7D7CE', '#EDA998', '#D98B7A', '#C75F4E', '#99493F']

function PrettyTooltip({ active, payload, label, type }) {
  if (!active || !payload || payload.length === 0) return null

  const visiblePayload = payload.filter((item) => item.value !== null && item.value !== undefined)
  if (visiblePayload.length === 0) return null

  const firstPayload = visiblePayload[0]?.payload || {}

  if (type === 'description') {
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-date">{firstPayload.dateLabel || label}</div>
        <div className="chart-tooltip-cycle">{firstPayload.cycleLabel}</div>
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
      <div className="chart-tooltip-date">{firstPayload.dateLabel || label}</div>
      <div className="chart-tooltip-cycle">{firstPayload.cycleLabel}</div>
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

function SymptomCell({ color, date, weekday, tooltip }) {
  return (
    <div className="symptom-day">
      <div
        className="symptom-cell has-tooltip"
        style={{ background: color }}
        data-tooltip={tooltip}
      />
      <span>{date}</span>
      {weekday && <small>{weekday}</small>}
    </div>
  )
}

function TextInsightList({ title, hint, items, emptyText, collapsible = false, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const totalCount = items.reduce((sum, item) => sum + item.count, 0)
  const contentId = `insight-${title.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-')}`

  return (
    <div className={`text-insight-block ${collapsible ? 'is-collapsible' : ''}`}>
      <div className="text-insight-heading">
        <h3>{title}</h3>
        {collapsible && (
          <button
            type="button"
            className="text-insight-toggle"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls={contentId}
          >
            <span>{items.length ? `${items.length} вариантов · ${totalCount} раз` : 'пусто'}</span>
            <i aria-hidden="true">{isOpen ? 'Свернуть' : 'Раскрыть'}</i>
          </button>
        )}
      </div>
      <p className="section-hint">{hint}</p>
      {isOpen && (
        <div id={contentId}>
          {items.length === 0 ? (
            <p className="text-insight-empty">{emptyText}</p>
          ) : (
            <ul className="text-insight-list">
              {items.map((item) => (
                <li key={item.text} className="text-insight-item">
                  <div>
                    <strong>{item.text}</strong>
                    <span>{item.dates.join(' · ')}</span>
                  </div>
                  <em>{item.count}</em>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function formatTreatmentDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function medicationLabel(record) {
  const medications = Array.isArray(record.medications) && record.medications.length > 0
    ? record.medications
    : record.medication || record.dosage
      ? [{ name: record.medication || '', dosage: record.dosage || '' }]
      : []

  return medications
    .map((item) => [item.name, item.dosage].filter(Boolean).join(' · '))
    .filter(Boolean)
    .join(', ')
}

function TreatmentSummary({ records }) {
  if (!records || records.length === 0) return null

  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const medicationRecords = sortedRecords.filter((record) => medicationLabel(record) && new Date(`${record.date}T00:00:00`) <= today)
  const currentMedication = medicationRecords.at(-1)
  const nextAppointment = sortedRecords.find((record) => record.kind === 'psychiatrist' && record.planned && new Date(`${record.date}T00:00:00`) >= today)

  return (
    <div className="treatment-summary">
      <div className="treatment-summary-main">
        <span>Лечение</span>
        {currentMedication ? (
          <strong>{medicationLabel(currentMedication)}</strong>
        ) : (
          <strong>Данные о лекарствах не указаны</strong>
        )}
        {nextAppointment && (
          <em>Следующий прием: {formatTreatmentDate(nextAppointment.date)}</em>
        )}
      </div>
      <div className="treatment-summary-timeline">
        {sortedRecords.filter((record) => record.kind === 'psychiatrist').slice(-5).map((record) => (
          <div key={record.id} className={record.planned ? 'is-planned' : ''}>
            <span>{formatTreatmentDate(record.date)}</span>
            <strong>{record.title}</strong>
            {medicationLabel(record) && <em>{medicationLabel(record)}</em>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Stats({ entries, treatmentRecords = [] }) {
  const latestEntryDate = entries.length
    ? parseEntryDate([...entries].sort((a, b) => parseEntryDate(a.date) - parseEntryDate(b.date)).at(-1).date)
    : new Date()
  const [periodMode, setPeriodMode] = useState('month')
  const [periodAnchor, setPeriodAnchor] = useState(latestEntryDate)

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>Пока нет данных для графика.</p>
        <p className="empty-state-sub">Сделай пару записей — и здесь появится динамика.</p>
      </div>
    )
  }

  const range = periodRange(periodMode, periodAnchor)
  const sortedEntries = [...entries]
    .sort((a, b) => parseEntryDate(a.date) - parseEntryDate(b.date))
    .filter((entry) => {
      if (!range) return true
      const entryDate = parseEntryDate(entry.date)
      return entryDate >= range.start && entryDate < range.end
    })

  const goToPreviousPeriod = () => {
    if (periodMode === 'all') return
    setPeriodAnchor((current) => periodMode === 'week' ? addDays(current, -7) : addMonths(current, -1))
  }

  const goToNextPeriod = () => {
    if (periodMode === 'all') return
    setPeriodAnchor((current) => periodMode === 'week' ? addDays(current, 7) : addMonths(current, 1))
  }

  const handleModeChange = (mode) => {
    setPeriodMode(mode)
    if (mode !== 'all') setPeriodAnchor(latestEntryDate)
  }

  const anxietyData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      Тревога: e.anxiety
    }
  })

  const energyData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      Энергия: e.energy
    }
  })

  const moodData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      'Утро': numberOrNull(e.morningMood),
      'Вечер': numberOrNull(e.eveningMood)
    }
  })

  const faceRednessData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      'Покраснение лица': FACE_REDNESS_LEVEL[e.faceRedness] ?? null,
      description: e.faceRedness || 'не указано'
    }
  })

  const dreamData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      'Тревожность сна': DREAM_LEVEL[e.dreamQuality] ?? null,
      description: e.dreamQuality || 'не указано',
      dreamContent: e.dreamContent
    }
  })

  const sleepLatencyData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      level: SLEEP_LATENCY_LEVEL[e.sleepLatency] ?? null,
      description: e.sleepLatency || 'не указано'
    }
  })

  const sleepHoursData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      'Часы сна': numberOrNull(e.sleepHours)
    }
  })

  const cryingData = sortedEntries.map((e) => {
    const date = dateInfo(e.date)
    return {
      date: date.shortDate,
      dateLabel: date.fullLabel,
      weekday: date.shortWeekday,
      cycleLabel: cycleLabel(e),
      Плач: CRYING_LEVEL[e.crying] ?? null,
      description: e.crying || 'не указано',
      color: CRYING_COLORS[CRYING_LEVEL[e.crying]] || '#F0EDE6'
    }
  })

  const faceRednessReasonStats = aggregateTextEntries(sortedEntries, 'faceRednessReason')
  const helpedOnePercentStats = aggregateTextEntries(sortedEntries, 'q1')
  const needsStats = aggregateNeedsEntries(sortedEntries)

  return (
    <div className="stats-block">
      <div className="stats-navigation">
        <div className="stats-period-switch" aria-label="Период статистики">
          {[
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' },
            { id: 'all', label: 'Всё' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={periodMode === mode.id ? 'is-active' : ''}
              onClick={() => handleModeChange(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="stats-period-controls">
          <button type="button" onClick={goToPreviousPeriod} disabled={periodMode === 'all'} aria-label="Предыдущий период">
            ‹
          </button>
          <span>{periodTitle(periodMode, periodAnchor)}</span>
          <button type="button" onClick={goToNextPeriod} disabled={periodMode === 'all'} aria-label="Следующий период">
            ›
          </button>
        </div>
      </div>

      <TreatmentSummary records={treatmentRecords} />

      {sortedEntries.length === 0 && (
        <div className="empty-state stats-empty-period">
          <p>В этом периоде пока нет записей.</p>
          <p className="empty-state-sub">Переключи неделю или месяц, чтобы посмотреть другие дни.</p>
        </div>
      )}

      {sortedEntries.length > 0 && (
          <>
            <h3 style={{marginTop: 8}}>Сон</h3>
            <p className="section-hint">
              Цветная лента показывает ощущение сна по дням. Сюжет сна остаётся в подсказке.
            </p>
            <div className="symptom-strip">
              {dreamData.map((entry, index) => {
                const level = entry['Тревожность сна']
                const background =
                    level === 0
                      ? DREAM_COLORS.calm
                      : level === 0.5
                        ? DREAM_COLORS.uneasy
                        : level === 1
                          ? DREAM_COLORS.anxious
                          : DREAM_COLORS.unknown
                return (
                    <SymptomCell
                        key={`${entry.date}-${index}`}
                        color={background}
                        date={entry.date}
                        weekday={entry.weekday}
                        tooltip={`${entry.dateLabel}, ${entry.cycleLabel} — ${entry.description}${entry.dreamContent ? `: ${entry.dreamContent}` : ''}`}
                    />
                )
              })}
            </div>
            <div className="symptom-legend">
              <span><i style={{background: DREAM_COLORS.calm}}/>Не тревожный сон</span>
              <span><i style={{background: DREAM_COLORS.uneasy}}/>Беспокойный сон</span>
              <span><i style={{background: DREAM_COLORS.anxious}}/>Тревожный сон</span>
              <span><i style={{background: DREAM_COLORS.unknown}}/>Не помню</span>
            </div>


            <h3 style={{marginTop: 28}}>Засыпание</h3>
            <p className="section-hint">
              Лента показывает, насколько быстро получилось уснуть.
            </p>
            <div className="symptom-strip">
              {sleepLatencyData.map((entry, index) => {
                const background = entry.level === null ? '#F0EDE6' : SLEEP_LATENCY_COLORS[entry.level]
                return (
                    <SymptomCell
                        key={`${entry.date}-${index}`}
                        color={background}
                        date={entry.date}
                        weekday={entry.weekday}
                        tooltip={`${entry.dateLabel}, ${entry.cycleLabel} — ${entry.description}`}
                    />
                )
              })}
            </div>
            <div className="symptom-legend">
              {SLEEP_LATENCY_OPTIONS.map((label) => (
                  <span key={label}>
            <i style={{background: SLEEP_LATENCY_LEVEL[label] === null ? '#F0EDE6' : SLEEP_LATENCY_COLORS[SLEEP_LATENCY_LEVEL[label]]}}/>
                    {label}
          </span>
              ))}
            </div>

            <h3 style={{marginTop: 28}}>Часы сна</h3>
            <p className="section-hint">Сколько часов получилось поспать ночью накануне.</p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sleepHoursData} margin={{top: 10, right: 20, left: -10, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
                  <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12}/>
                  <YAxis domain={[0, 12]} stroke="var(--color-text-soft)" fontSize={12}/>
                  <Tooltip content={<PrettyTooltip/>}/>
                  <Line type="monotone" dataKey="Часы сна" stroke="#D98B7A" strokeWidth={2} dot={{r: 3}} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{marginTop: 28}}>Энергия</h3>
            <p className="section-hint">Шкала 0–5: чем выше значение, тем больше ресурса.</p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={energyData} margin={{top: 10, right: 20, left: -10, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
                  <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12}/>
                  <YAxis domain={[0, 5]} stroke="var(--color-text-soft)" fontSize={12}/>
                  <Tooltip content={<PrettyTooltip/>}/>
                  <Line type="monotone" dataKey="Энергия" stroke="#7C9885" strokeWidth={2} dot={{r: 3}} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{marginTop: 28}}>Тревога</h3>
            <p className="section-hint">Шкала 0–5: чем выше значение, тем сильнее тревога.</p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={anxietyData} margin={{top: 10, right: 20, left: -10, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
                  <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12}/>
                  <YAxis domain={[0, 5]} stroke="var(--color-text-soft)" fontSize={12}/>
                  <Tooltip content={<PrettyTooltip/>}/>
                  <Line type="monotone" dataKey="Тревога" stroke="#A08CB3" strokeWidth={2} dot={{r: 3}} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{marginTop: 28}}>Настроение</h3>
            <p className="section-hint">
              Шкала 0–5: две линии показывают общий фон утром и вечером.
            </p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={moodData} margin={{top: 10, right: 20, left: -10, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
                  <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12}/>
                  <YAxis domain={[0, 5]} stroke="var(--color-text-soft)" fontSize={12}/>
                  <Tooltip content={<PrettyTooltip/>}/>
                  <Line type="monotone" dataKey="Утро" stroke="#D6A65F" strokeWidth={2} dot={{r: 3}} connectNulls/>
                  <Line type="monotone" dataKey="Вечер" stroke="#7C9885" strokeWidth={2} dot={{r: 3}} connectNulls/>
                </LineChart>
              </ResponsiveContainer>
            </div>


            <h3 style={{marginTop: 28}}>Покраснение лица</h3>
            <p className="section-hint">
              Лента показывает степень и характер покраснения по дням: от светлого “не краснело” до насыщенного
              “краснело, зудело и болело”.
            </p>
            <div className="symptom-strip">
              {faceRednessData.map((entry, index) => {
                const level = entry['Покраснение лица']
                const background = level === null ? '#F0EDE6' : FACE_REDNESS_COLORS[level]
                return (
                    <SymptomCell
                        key={`${entry.date}-${index}`}
                        color={background}
                        date={entry.date}
                        weekday={entry.weekday}
                        tooltip={`${entry.dateLabel}, ${entry.cycleLabel} — ${entry.description}`}
                    />
                )
              })}
            </div>
            <div className="symptom-legend">
              {[
                'Не краснело',
                'Немного краснело',
                'Краснело сильно',
                'Краснело и зудело',
                'Краснело и болело',
                'Краснело, зудело и болело'
              ].map((label) => (
                  <span key={label}>
            <i style={{background: FACE_REDNESS_COLORS[FACE_REDNESS_LEVEL[label]]}}/>
                    {label}
          </span>
              ))}
            </div>

            <h3 style={{marginTop: 28}}>Плач по дням</h3>
            <p className="section-hint">
              0 — не плакала, 1 — хотелось плакать, 2 — немного, 3 — долго, 4 — не могла остановиться.
            </p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cryingData} margin={{top: 10, right: 20, left: -10, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
                  <XAxis dataKey="date" stroke="var(--color-text-soft)" fontSize={12}/>
                  <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} stroke="var(--color-text-soft)" fontSize={12}/>
                  <Tooltip content={<PrettyTooltip type="description"/>} cursor={{fill: 'rgba(124, 152, 133, 0.08)'}}/>
                  <Bar dataKey="Плач" radius={[6, 6, 0, 0]} minPointSize={4}>
                    {cryingData.map((entry, index) => (
                        <Cell key={`${entry.date}-${index}`} fill={entry.color}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="symptom-legend">
              {['Не плакала', 'Хотелось плакать', 'Немного плакала', 'Долго плакала', 'Не могла остановиться'].map((label) => (
                  <span key={label}>
            <i style={{background: CRYING_COLORS[CRYING_LEVEL[label]]}}/>
                    {label}
          </span>
              ))}
            </div>

            <TextInsightList
                title="Возможные причины покраснения"
                hint="Повторяющиеся ответы из поля «С чем я это связываю?»."
                items={faceRednessReasonStats}
                emptyText="Пока нет заполненных причин покраснения."
            />

            <TextInsightList
                title="Что помогло хотя бы на 1%"
                hint="Повторяющиеся ответы из обращения к себе."
                items={helpedOnePercentStats}
                emptyText="Пока нет заполненных ответов про то, что помогло."
                collapsible
                defaultOpen={false}
            />

            <TextInsightList
                title="Что сейчас нужнее всего"
                hint="Повторяющиеся потребности, которые можно обсудить и отследить."
                items={needsStats}
                emptyText="Пока нет заполненных ответов про потребности."
                collapsible
                defaultOpen={false}
            />
          </>
      )}
    </div>
  )
}
