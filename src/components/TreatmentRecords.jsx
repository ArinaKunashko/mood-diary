import { useState } from 'react'
import { makeEmptyTreatmentRecord } from '../utils/storage.js'

const KIND_LABELS = {
  psychiatrist: 'Психиатр',
  psychologist: 'Психолог'
}

const KIND_OPTIONS = [
  { id: 'psychiatrist', label: 'Психиатр' },
  { id: 'psychologist', label: 'Психолог' }
]

function formatDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function TreatmentForm({ initialRecord, onSave, onCancel, isSaving }) {
  const [record, setRecord] = useState(initialRecord)
  const isPsychiatrist = record.kind === 'psychiatrist'
  const notesList = Array.isArray(record.notesList) && record.notesList.length > 0 ? record.notesList : ['']
  const medications = Array.isArray(record.medications) && record.medications.length > 0
    ? record.medications
    : record.medication || record.dosage
      ? [{ name: record.medication || '', dosage: record.dosage || '' }]
      : [{ name: '', dosage: '' }]
  const update = (patch) => setRecord((current) => ({ ...current, ...patch }))
  const updateNote = (index, value) => {
    update({ notesList: notesList.map((item, itemIndex) => itemIndex === index ? value : item) })
  }
  const addNote = () => update({ notesList: [...notesList, ''] })
  const removeNote = (index) => {
    const nextNotes = notesList.filter((_, itemIndex) => itemIndex !== index)
    update({ notesList: nextNotes.length > 0 ? nextNotes : [''] })
  }
  const updateMedication = (index, patch) => {
    update({
      medications: medications.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    })
  }
  const addMedication = () => update({ medications: [...medications, { name: '', dosage: '' }] })
  const removeMedication = (index) => {
    const nextMedications = medications.filter((_, itemIndex) => itemIndex !== index)
    update({ medications: nextMedications.length > 0 ? nextMedications : [{ name: '', dosage: '' }] })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const cleanNotesList = notesList.map((item) => item.trim()).filter(Boolean)
    const cleanMedications = isPsychiatrist
      ? medications
          .map((item) => ({ name: item.name.trim(), dosage: item.dosage.trim() }))
          .filter((item) => item.name || item.dosage)
      : []
    onSave({
      ...record,
      medications: cleanMedications,
      medication: cleanMedications[0]?.name || '',
      dosage: cleanMedications[0]?.dosage || '',
      notesList: cleanNotesList,
      notes: cleanNotesList.join('\n')
    })
  }

  return (
    <form className="treatment-form" onSubmit={handleSubmit}>
      <div className="treatment-form-grid">
        <label className="stacked-field">
          Дата
          <input
            className="text-input"
            type="date"
            value={record.date}
            onChange={(event) => update({ date: event.target.value })}
            required
          />
        </label>

        <label className="stacked-field">
          С кем встреча
          <select
            className="text-input"
            value={record.kind}
            onChange={(event) => {
              const nextKind = event.target.value
              update({
                kind: nextKind,
                specialist: nextKind === 'psychiatrist' ? 'Психиатр' : 'Психолог',
                medication: nextKind === 'psychiatrist' ? record.medication : '',
                dosage: nextKind === 'psychiatrist' ? record.dosage : '',
                medications: nextKind === 'psychiatrist' ? medications : []
              })
            }}
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="stacked-field">
        Название
        <input
          className="text-input"
          type="text"
          placeholder={isPsychiatrist ? 'Например: прием психиатра или изменение дозировки' : 'Например: сессия с психологом'}
          value={record.title}
          onChange={(event) => update({ title: event.target.value })}
          required
        />
      </label>

      {isPsychiatrist && (
        <div className="stacked-field">
          <span>Препараты</span>
          <div className="treatment-medications">
            {medications.map((item, index) => (
              <div key={index} className="treatment-medication-row">
                <input
                  className="text-input"
                  type="text"
                  placeholder="Дулоксента"
                  value={item.name}
                  onChange={(event) => updateMedication(index, { name: event.target.value })}
                />
                <input
                  className="text-input"
                  type="text"
                  placeholder="60 мг"
                  value={item.dosage}
                  onChange={(event) => updateMedication(index, { dosage: event.target.value })}
                />
                <button
                  type="button"
                  className="treatment-point-remove"
                  onClick={() => removeMedication(index)}
                  aria-label="Удалить препарат"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-small treatment-point-add" onClick={addMedication}>
            Добавить препарат
          </button>
        </div>
      )}

      <label className="stacked-field treatment-checkbox">
        <input
          type="checkbox"
          checked={record.planned}
          onChange={(event) => update({ planned: event.target.checked })}
        />
        Это запланированная будущая запись
      </label>

      <div className="stacked-field">
        <span>{isPsychiatrist ? 'Главное с приема' : 'Главное с сессии'}</span>
        <div className="treatment-points">
          {notesList.map((note, index) => (
            <div key={index} className="treatment-point-row">
              <textarea
                className="text-input"
                type="text"
                placeholder={isPsychiatrist ? 'Что обсудили, назначили или важно помнить' : 'Что поняла или хочется удержать'}
                value={note}
                onChange={(event) => updateNote(index, event.target.value)}
              />
              <button
                type="button"
                className="treatment-point-remove"
                onClick={() => removeNote(index)}
                aria-label="Удалить пункт"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-small treatment-point-add" onClick={addNote}>
          Добавить пункт
        </button>
      </div>

      <label className="stacked-field">
        Наблюдаю за
        <textarea
          className="text-area"
          rows={2}
          placeholder={isPsychiatrist ? 'Что отслеживать до следующего приема' : 'Что попробовать, заметить или принести на следующую сессию'}
          value={record.followUp}
          onChange={(event) => update({ followUp: event.target.value })}
        />
      </label>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}

export default function TreatmentRecords({ records, onSave, onDelete, isSaving }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [activeKind, setActiveKind] = useState('psychiatrist')
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))
  const visibleRecords = sortedRecords.filter((record) => record.kind === activeKind)
  const activeKindLabel = activeKind === 'psychiatrist' ? 'психиатра' : 'психолога'

  const handleSave = async (record) => {
    const saved = await onSave(record)
    if (!saved) return
    setIsAdding(false)
    setEditingRecord(null)
  }

  return (
    <div className="treatment-page">
      <div className="treatment-header">
        <div>
          <h2>Лечение</h2>
        </div>
        {!isAdding && !editingRecord && (
          <button type="button" className="btn btn-primary btn-small" onClick={() => setIsAdding(true)}>
            Добавить
          </button>
        )}
      </div>

      {!isAdding && !editingRecord && (
        <div className="treatment-kind-tabs" aria-label="Раздел лечения">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={activeKind === option.id ? 'is-active' : ''}
              onClick={() => setActiveKind(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {(isAdding || editingRecord) && (
        <TreatmentForm
          key={editingRecord?.id || 'new-treatment-record'}
          initialRecord={editingRecord || {
            ...makeEmptyTreatmentRecord(),
            kind: activeKind,
            specialist: activeKind === 'psychiatrist' ? 'Психиатр' : 'Психолог',
            title: activeKind === 'psychiatrist' ? 'Прием у Евгением Александровичем' : 'Сессия с Марией'
          }}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false)
            setEditingRecord(null)
          }}
          isSaving={isSaving}
        />
      )}

      {!isAdding && !editingRecord && (
        <section className="treatment-group">
          <p>{activeKind === 'psychiatrist' ? 'Приемы, назначения, препарат и дозировка.' : 'Сессии и главные мысли.'}</p>
          {visibleRecords.length === 0 ? (
            <div className="treatment-empty">Пока нет записей {activeKindLabel}.</div>
          ) : (
            <ul className="treatment-list">
              {visibleRecords.map((record) => (
                  <li key={record.id} className={`treatment-item ${record.planned ? 'is-planned' : ''}`}>
                    <div className="treatment-item-top">

                      <div className="treatment-item-date">
                        <span>{formatDate(record.date)}</span>
                        {/*<em>{record.planned ? 'запланировано' : KIND_LABELS[record.kind] || 'Запись'}</em>*/}
                      </div>

                      <div className="treatment-actions">
                        <button type="button" className="btn btn-ghost btn-small"
                                onClick={() => setEditingRecord(record)}>
                          Изменить
                        </button>
                        <button type="button" className="treatment-delete" onClick={() => onDelete(record.id)}
                                aria-label="Удалить запись лечения">
                          ✕
                        </button>
                      </div>

                    </div>


                    <div className="treatment-item-body">
                      <h3>{record.title}</h3>
                      {Array.isArray(record.medications) && record.medications.length > 0 ? (
                          <div className="treatment-dose-list">
                            {record.medications.map((item) => (
                                <span key={`${item.name}-${item.dosage}`}>
                                  {[item.name, item.dosage].filter(Boolean).join(' · ')}
                                </span>
                            ))}
                          </div>
                      ) : (record.medication || record.dosage) && (
                          <p className="treatment-dose">{[record.medication, record.dosage].filter(Boolean).join(' · ')}</p>
                      )}
                      {Array.isArray(record.notesList) && record.notesList.length > 0 ? (
                          <ul className="treatment-note-list">
                            {record.notesList.map((note) => <li key={note}>{note}</li>)}
                          </ul>
                      ) : record.notes && <p>{record.notes}</p>}
                      {record.followUp && <p className="treatment-followup"><span>Наблюдаю за</span> {record.followUp}</p>}
                    </div>

                  </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
