function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

function TagRow({ label, items }) {
  if (!items || items.length === 0) return null
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <div className="entry-card-tags">
        {items.map((i) => <span key={i} className="mini-tag">{i}</span>)}
      </div>
    </div>
  )
}

export default function EntryDetail({ entry, onEdit, onClose }) {
  const d = new Date(entry.date)
  const dateLabel = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="entry-detail">
      <div className="detail-header">
        <h2>{dateLabel}</h2>
        <div className="detail-header-actions">
          <button className="btn btn-ghost" onClick={onClose}>Назад</button>
          <button className="btn btn-primary" onClick={onEdit}>Редактировать</button>
        </div>
      </div>

      {entry.oneSentence && <p className="detail-sentence">«{entry.oneSentence}»</p>}

      <TagRow label="Эмоции" items={entry.emotions} />
      <Row label="День цикла" value={entry.cycleDay ? `${entry.cycleDay} день` : null} />
      <Row label="Другие эмоции" value={entry.emotionOther} />
      <Row label="Сила эмоций" value={entry.intensity !== null ? `${entry.intensity}/5` : null} />
      <Row label="Тревога" value={entry.anxiety !== null ? `${entry.anxiety}/5` : null} />
      <Row label="Энергия" value={entry.energy !== null ? `${entry.energy}/5` : null} />
      <Row label="Работоспособность" value={entry.productivity !== null ? `${entry.productivity}/5` : null} />
      <Row label="Желание общаться" value={entry.social !== null ? `${entry.social}/5` : null} />
      <Row label="Желание активности" value={entry.activity !== null ? `${entry.activity}/5` : null} />
      <Row label="Плач" value={entry.crying} />
      <Row label="Сон" value={entry.dreamQuality} />
      <Row label="Как быстро уснула" value={entry.sleepLatency} />
      <Row label="Что снилось" value={entry.dreamContent} />
      <Row label="Краснело ли лицо" value={entry.faceRedness} />
      <TagRow label="Тело" items={entry.body} />
      <Row label="Другие ощущения" value={entry.bodyOther} />
      <Row label="Мысли" value={entry.thoughts} />
      <Row label="Что происходило" value={entry.events} />
      <TagRow label="Что помогло" items={entry.helped} />
      <Row label="Другое (помогло)" value={entry.helpedOther} />
      <Row label="Тяжесть состояния" value={entry.hardship !== null ? `${entry.hardship}/10` : null} />

      {(entry.q1 || entry.q2 || entry.q3) && (
        <div className="detail-reflection">
          <h3>💙 Небольшое обращение к себе</h3>
          <Row label="Что помогло хотя бы на 1%" value={entry.q1} />
          <Row label="Что нужнее всего" value={entry.q2} />
          <Row label="Что можно сделать в ближайший час" value={entry.q3} />
        </div>
      )}
    </div>
  )
}
