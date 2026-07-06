import { useState } from 'react'
import ScaleSlider from './ScaleSlider.jsx'
import MultiSelect from './MultiSelect.jsx'
import {
  BODY_SIGNALS,
  CRYING_OPTIONS,
  DREAM_OPTIONS,
  EMOTIONS,
  FACE_REDNESS_OPTIONS,
  HELPED_OPTIONS,
  SCALE_LABELS
} from '../data/options.js'

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

export default function EntryForm({ initialEntry, onSave, onCancel, isSaving = false }) {
  const [entry, setEntry] = useState(initialEntry)

  const update = (patch) => setEntry((prev) => ({ ...prev, ...patch }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(entry)
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <label className="date-field">
          Дата
          <input
            type="date"
            value={entry.date}
            onChange={(e) => update({ date: e.target.value })}
            required
          />
        </label>
        <label className="date-field">
          День цикла
          <input
            inputMode="numeric"
            value={entry.cycleDay ?? ''}
            onChange={(e) => update({ cycleDay: e.target.value })}
          />
        </label>
      </div>

      <section className="form-section">
        <h3> Какие эмоции я сейчас испытываю?</h3>
        <MultiSelect
          label="Можно отметить несколько"
          options={EMOTIONS}
          selected={entry.emotions}
          onToggle={(opt) => update({ emotions: toggleInArray(entry.emotions, opt) })}
          otherValue={entry.emotionOther}
          onOtherChange={(v) => update({ emotionOther: v })}
        />
      </section>

      <section className="form-section">
        <h3>Насколько сильны переживания?</h3>
        <ScaleSlider
          label="Сила эмоций"
          value={entry.intensity}
          onChange={(v) => update({ intensity: v })}
          labels={SCALE_LABELS.intensity}
        />
        <ScaleSlider
          label="Сила тревоги"
          value={entry.anxiety}
          onChange={(v) => update({ anxiety: v })}
          labels={SCALE_LABELS.anxiety}
        />
      </section>

      <section className="form-section">
        <h3>Ресурс</h3>
        <ScaleSlider
          label="Уровень энергии"
          value={entry.energy}
          onChange={(v) => update({ energy: v })}
          labels={SCALE_LABELS.energy}
        />
        <ScaleSlider
          label="Работоспособность"
          value={entry.productivity}
          onChange={(v) => update({ productivity: v })}
          labels={SCALE_LABELS.productivity}
        />
        <ScaleSlider
          label="Желание общаться"
          value={entry.social}
          onChange={(v) => update({ social: v })}
          labels={SCALE_LABELS.social}
        />
        <ScaleSlider
          label="Желание активности"
          value={entry.activity}
          onChange={(v) => update({ activity: v })}
          labels={SCALE_LABELS.activity}
        />
      </section>

      <section className="form-section">
        <h3>Плач</h3>
        <div className="pill-row">
          {CRYING_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`pill ${entry.crying === opt ? 'is-active' : ''}`}
              onClick={() => update({ crying: entry.crying === opt ? '' : opt })}
              aria-pressed={entry.crying === opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h3>Сон</h3>
        <p className="section-hint">
          Отмечай именно ощущение сна: страшный сюжет может быть не тревожным, если во сне был азарт или игра.
        </p>
        <div className="pill-row">
          {DREAM_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`pill ${entry.dreamQuality === opt ? 'is-active' : ''}`}
              onClick={() => update({ dreamQuality: entry.dreamQuality === opt ? '' : opt })}
              aria-pressed={entry.dreamQuality === opt}
            >
              {opt}
            </button>
          ))}
        </div>
        <textarea
          className="text-area other-input"
          rows={2}
          placeholder="Сюжет или ощущение сна: призраки, погоня, азарт, игра, страх..."
          value={entry.dreamContent}
          onChange={(e) => update({ dreamContent: e.target.value })}
        />
      </section>

      <section className="form-section">
        <h3>Краснело ли лицо?</h3>
        <div className="pill-row">
          {FACE_REDNESS_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`pill ${entry.faceRedness === opt ? 'is-active' : ''}`}
              onClick={() => update({ faceRedness: entry.faceRedness === opt ? '' : opt })}
              aria-pressed={entry.faceRedness === opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h3>Что происходит в теле?</h3>
        <MultiSelect
          label="Можно отметить несколько"
          options={BODY_SIGNALS}
          selected={entry.body}
          onToggle={(opt) => update({ body: toggleInArray(entry.body, opt) })}
          otherValue={entry.bodyOther}
          onOtherChange={(v) => update({ bodyOther: v })}
        />
      </section>

      <section className="form-section">
        <h3>Какие мысли сейчас чаще всего приходят?</h3>
        <textarea
          className="text-area"
          rows={3}
          value={entry.thoughts}
          onChange={(e) => update({ thoughts: e.target.value })}
        />
      </section>

      <section className="form-section">
        <h3>Что сегодня происходило?</h3>
        <p className="section-hint">события, которые могли повлиять на состояние</p>
        <textarea
          className="text-area"
          rows={3}
          value={entry.events}
          onChange={(e) => update({ events: e.target.value })}
        />
      </section>

      <section className="form-section">
        <h3>Что помогло?</h3>
        <MultiSelect
          label="Можно отметить несколько"
          options={HELPED_OPTIONS}
          selected={entry.helped}
          onToggle={(opt) => update({ helped: toggleInArray(entry.helped, opt) })}
          otherValue={entry.helpedOther}
          onOtherChange={(v) => update({ helpedOther: v })}
        />
      </section>

        <section className="form-section">
            <h3>Насколько тяжело мне сейчас проживать это состояние</h3>
            <ScaleSlider
                value={entry.hardship}
                onChange={(v) => update({hardship: v})}
                max={10}
            />
        </section>

        <section className="form-section">
        <h3>Одним предложением</h3>
        <input
          type="text"
          className="text-input"
          placeholder="Сегодня мое состояние можно описать так…"
          value={entry.oneSentence}
          onChange={(e) => update({ oneSentence: e.target.value })}
        />
      </section>

      <section className="form-section reflection">
        <h3>💛 Небольшое обращение к себе</h3>
        <label className="stacked-field">
          Что сегодня помогло мне хотя бы на 1%?
          <textarea
            className="text-area"
            rows={2}
            value={entry.q1}
            onChange={(e) => update({ q1: e.target.value })}
          />
        </label>
        <label className="stacked-field">
          Что сейчас мне нужнее всего?
          <textarea
            className="text-area"
            rows={2}
            value={entry.q2}
            onChange={(e) => update({ q2: e.target.value })}
          />
        </label>
        <label className="stacked-field">
          Что я могу сделать для себя в ближайший час?
          <textarea
            className="text-area"
            rows={2}
            value={entry.q3}
            onChange={(e) => update({ q3: e.target.value })}
          />
        </label>
      </section>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Сохраняю...' : 'Сохранить запись'}
        </button>
      </div>
    </form>
  )
}
