import { useState } from 'react'
import { makeEmptyTreatmentRecord } from '../utils/storage.js'

const KIND_LABELS = {
  psychiatrist: 'Психиатр',
  psychologist: 'Психолог',
  medication: 'Таблетки'
}

const KIND_OPTIONS = [
  { id: 'psychiatrist', label: 'Психиатр' },
  { id: 'psychologist', label: 'Психолог' },
  { id: 'medication', label: 'Таблетки' }
]

const MEDICATION_STATUS_OPTIONS = [
  { id: 'taking', label: 'Прием' },
  { id: 'break', label: 'Перерыв' }
]

function formatDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function shortDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function medicationName(record) {
  return record.medication?.trim() || 'Без названия'
}

function periodsFromRecord(record) {
  if (Array.isArray(record.medicationPeriods) && record.medicationPeriods.length > 0) {
    return record.medicationPeriods.map((period) => ({
      id: period.id || `${record.id}-${period.startDate}-${period.status}`,
      parentId: record.id,
      status: period.status || 'taking',
      startDate: period.startDate || record.date,
      endDate: period.endDate || '',
      dosage: period.dosage || '',
      notes: period.notes || ''
    }))
  }

  return [{
    id: record.id,
    parentId: record.id,
    status: record.medicationStatus || 'taking',
    startDate: record.date,
    endDate: record.endDate || '',
    dosage: record.dosage || '',
    notes: record.notes || ''
  }]
}

function groupMedicationRecords(records) {
  const groups = new Map()

  records.forEach((record) => {
    const name = medicationName(record)
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push({
      record,
      periods: periodsFromRecord(record)
    })
  })

  return [...groups.entries()]
    .map(([name, items]) => {
      const periods = items
        .flatMap((item) => item.periods.map((period) => ({ ...period, record: item.record })))
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      return {
        name,
        records: items.map((item) => item.record),
        periods
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

function TreatmentForm({ initialRecord, onSave, onCancel, isSaving }) {
  const [record, setRecord] = useState(initialRecord)
  const isPsychiatrist = record.kind === 'psychiatrist'
  const isMedication = record.kind === 'medication'
  const notesList = Array.isArray(record.notesList) && record.notesList.length > 0 ? record.notesList : ['']
  const medications = Array.isArray(record.medications) && record.medications.length > 0
    ? record.medications
    : record.medication || record.dosage
      ? [{ name: record.medication || '', dosage: record.dosage || '' }]
      : [{ name: '', dosage: '' }]
  const medicationPeriods = Array.isArray(record.medicationPeriods) && record.medicationPeriods.length > 0
    ? record.medicationPeriods
    : [{
        id: crypto.randomUUID(),
        status: record.medicationStatus || 'taking',
        startDate: record.date,
        endDate: record.endDate || '',
        dosage: record.dosage || '',
        notes: record.notes || ''
      }]
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
  const updateMedicationPeriod = (index, patch) => {
    update({
      medicationPeriods: medicationPeriods.map((period, itemIndex) => {
        if (itemIndex !== index) return period
        const nextPeriod = { ...period, ...patch }
        return nextPeriod.status === 'break' ? { ...nextPeriod, dosage: '' } : nextPeriod
      })
    })
  }
  const addMedicationPeriod = (status = 'taking') => {
    update({
      medicationPeriods: [
        ...medicationPeriods,
        {
          id: crypto.randomUUID(),
          status,
          startDate: record.date || new Date().toISOString().slice(0, 10),
          endDate: '',
          dosage: '',
          notes: ''
        }
      ]
    })
  }
  const removeMedicationPeriod = (index) => {
    const nextPeriods = medicationPeriods.filter((_, itemIndex) => itemIndex !== index)
    update({ medicationPeriods: nextPeriods.length > 0 ? nextPeriods : medicationPeriods })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const cleanNotesList = notesList.map((item) => item.trim()).filter(Boolean)
    const cleanMedications = isPsychiatrist
      ? medications
          .map((item) => ({ name: item.name.trim(), dosage: item.dosage.trim() }))
          .filter((item) => item.name || item.dosage)
      : []
    const cleanMedicationPeriods = isMedication
      ? medicationPeriods
          .map((period) => ({
            id: period.id || crypto.randomUUID(),
            status: period.status || 'taking',
            startDate: period.startDate,
            endDate: period.endDate || '',
            dosage: period.status === 'break' ? '' : period.dosage.trim(),
            notes: period.notes.trim()
          }))
          .filter((period) => period.startDate)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      : []
    const firstPeriod = cleanMedicationPeriods[0]
    onSave({
      ...record,
      medications: cleanMedications,
      medication: isMedication ? record.medication.trim() : cleanMedications[0]?.name || '',
      dosage: isMedication ? firstPeriod?.dosage || '' : cleanMedications[0]?.dosage || '',
      title: isMedication ? record.medication.trim() : record.title,
      date: isMedication ? firstPeriod?.startDate || record.date : record.date,
      endDate: isMedication ? firstPeriod?.endDate || '' : record.endDate,
      medicationStatus: isMedication ? firstPeriod?.status || 'taking' : record.medicationStatus,
      medicationPeriods: cleanMedicationPeriods,
      notesList: cleanNotesList,
      notes: isMedication ? '' : cleanNotesList.join('\n')
    })
  }

  if (isMedication) {
    return (
      <form className="treatment-form" onSubmit={handleSubmit}>
        <label className="stacked-field">
          Препарат
          <input
            className="text-input"
            type="text"
            placeholder="Дулоксента"
            value={record.medication}
            onChange={(event) => update({ medication: event.target.value })}
            required
          />
        </label>

        <div className="stacked-field">
          <span>История приема</span>
          <div className="medication-period-form-list">
            {medicationPeriods.map((period, index) => {
              const isBreak = period.status === 'break'

              return (
                <div key={period.id || index} className={`medication-period-form ${isBreak ? 'is-break' : ''}`}>
                  <div className="treatment-status-tabs" aria-label="Тип периода приема">
                    {MEDICATION_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={(period.status || 'taking') === option.id ? 'is-active' : ''}
                        onClick={() => updateMedicationPeriod(index, { status: option.id })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="treatment-form-grid treatment-medication-period-grid">
                    <label className="stacked-field treatment-date-field">
                      С какого числа
                      <input
                        className="text-input"
                        type="date"
                        value={period.startDate}
                        onChange={(event) => updateMedicationPeriod(index, { startDate: event.target.value })}
                        required
                      />
                    </label>

                    <label className="stacked-field treatment-date-field">
                      По какое число
                      <input
                        className="text-input"
                        type="date"
                        value={period.endDate || ''}
                        onChange={(event) => updateMedicationPeriod(index, { endDate: event.target.value })}
                      />
                    </label>

                    <label className="stacked-field">
                      Дозировка
                      <input
                        className="text-input"
                        type="text"
                        placeholder={isBreak ? 'Не нужно для перерыва' : '90 мг'}
                        value={period.dosage}
                        disabled={isBreak}
                        onChange={(event) => updateMedicationPeriod(index, { dosage: event.target.value })}
                      />
                    </label>

                    <label className="stacked-field">
                      Комментарий
                      <input
                        className="text-input"
                        type="text"
                        placeholder={isBreak ? 'Почему был перерыв' : 'Например: повысили удаленно'}
                        value={period.notes}
                        onChange={(event) => updateMedicationPeriod(index, { notes: event.target.value })}
                      />
                    </label>
                  </div>

                  {medicationPeriods.length > 1 && (
                    <button
                      type="button"
                      className="treatment-point-remove medication-period-remove"
                      onClick={() => removeMedicationPeriod(index)}
                      aria-label="Удалить период"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <div className="medication-period-actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => addMedicationPeriod('taking')}>
              Добавить прием
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => addMedicationPeriod('break')}>
              Добавить перерыв
            </button>
          </div>
        </div>

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

  return (
    <form className="treatment-form" onSubmit={handleSubmit}>
      <div className="treatment-form-grid">
        <label className="stacked-field treatment-date-field">
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
  const medicationGroups = groupMedicationRecords(visibleRecords)
  const activeKindLabel = activeKind === 'psychiatrist' ? 'психиатра' : activeKind === 'psychologist' ? 'психолога' : 'таблеток'

  const handleSave = async (record) => {
    const saved = await onSave(record)
    if (!saved) return
    setIsAdding(false)
    setEditingRecord(null)
  }

  const handleDeleteMedicationPeriod = async (period) => {
    const parentRecord = period.record
    if (!parentRecord) return

    if (Array.isArray(parentRecord.medicationPeriods) && parentRecord.medicationPeriods.length > 1) {
      const nextPeriods = parentRecord.medicationPeriods.filter((item) => item.id !== period.id)
      const saved = await onSave({
        ...parentRecord,
        medicationPeriods: nextPeriods
      })
      if (saved) setEditingRecord(null)
      return
    }

    onDelete(parentRecord.id)
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
            specialist: activeKind === 'psychiatrist' ? 'Психиатр' : activeKind === 'psychologist' ? 'Психолог' : '',
            title: activeKind === 'psychiatrist' ? 'Прием у Евгением Александровичем' : activeKind === 'psychologist' ? 'Сессия с Марией' : 'Изменение схемы приема'
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
          <p>
            {activeKind === 'psychiatrist'
              ? 'Приемы, назначения и решения врача.'
                : activeKind === 'psychologist'
                  ? 'Сессии и главные мысли.'
                  : 'Каждый препарат собран отдельно: внутри видно дозировки, перерывы и возвращение к приему по датам.'}
          </p>
          {visibleRecords.length === 0 ? (
            <div className="treatment-empty">Пока нет записей {activeKindLabel}.</div>
          ) : activeKind === 'medication' ? (
            <div className="medication-groups">
              {medicationGroups.map((group) => {
                const lastPeriod = group.periods.at(-1)
                const isCurrent = lastPeriod && !lastPeriod.endDate && lastPeriod.status !== 'break'
                const editableRecord = group.records.at(-1)

                return (
                  <section key={group.name} className="medication-group">
                    <div className="medication-group-header">
                      <div>
                        <h3>{group.name}</h3>
                        <p>{isCurrent ? `Сейчас: ${lastPeriod.dosage || 'дозировка не указана'}` : 'Сейчас не отмечен активный прием'}</p>
                      </div>
                      {editableRecord && (
                        <div className="treatment-actions">
                          <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditingRecord(editableRecord)}>
                            Изменить
                          </button>
                          {group.records.length === 1 && (
                            <button
                              type="button"
                              className="treatment-delete"
                              onClick={() => onDelete(editableRecord.id)}
                              aria-label="Удалить препарат"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <ol className="medication-timeline">
                      {group.periods.map((period) => {
                        const isBreak = period.status === 'break'

                        return (
                          <li key={period.id} className={isBreak ? 'is-break' : ''}>
                            <div className="medication-timeline-marker" />
                            <div className="medication-timeline-card">
                              <div className="medication-timeline-top">
                                <span>{shortDate(period.startDate)} — {period.endDate ? shortDate(period.endDate) : 'сейчас'}</span>
                                <button
                                  type="button"
                                  className="treatment-delete"
                                  onClick={() => handleDeleteMedicationPeriod(period)}
                                  aria-label="Удалить период приема"
                                >
                                  ✕
                                </button>
                              </div>
                              <strong>{isBreak ? 'Перерыв' : period.dosage || 'Прием, дозировка не указана'}</strong>
                              {period.notes && <p>{period.notes}</p>}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </section>
                )
              })}
            </div>
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
                      {record.kind === 'medication' && (
                        <div className="treatment-period-card">
                          <strong>{[record.medication, record.dosage].filter(Boolean).join(' · ')}</strong>
                          <span>
                            с {formatDate(record.date)}
                            {record.endDate ? ` по ${formatDate(record.endDate)}` : ' по сейчас'}
                          </span>
                        </div>
                      )}
                      {record.kind !== 'medication' && Array.isArray(record.medications) && record.medications.length > 0 ? (
                          <div className="treatment-dose-list">
                            {record.medications.map((item) => (
                                <span key={`${item.name}-${item.dosage}`}>
                                  {[item.name, item.dosage].filter(Boolean).join(' · ')}
                                </span>
                            ))}
                          </div>
                      ) : record.kind !== 'medication' && (record.medication || record.dosage) && (
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
