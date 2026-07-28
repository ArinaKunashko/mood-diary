import { useState } from 'react'
import { makeEmptyTestRecord } from '../utils/storage.js'

function formatDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Не удалось открыть изображение'))
      image.onload = () => {
        const maxSide = 1400
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function TestForm({ initialRecord, onSave, onCancel, isSaving }) {
  const [record, setRecord] = useState(initialRecord)
  const [imageStatus, setImageStatus] = useState('')
  const update = (patch) => setRecord((current) => ({ ...current, ...patch }))

  const handleScreenshotChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageStatus('Обрабатываю скрин...')
    try {
      const screenshot = await compressImage(file)
      update({ screenshot, screenshotName: file.name })
      setImageStatus('Скрин добавлен')
    } catch (e) {
      setImageStatus(e.message)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(record)
  }

  return (
    <form className="test-form" onSubmit={handleSubmit}>
      <div className="test-form-grid">
        <label className="stacked-field">
          Дата прохождения
          <input
            className="text-input"
            type="date"
            value={record.date}
            onChange={(event) => update({ date: event.target.value })}
            required
          />
        </label>

        <label className="stacked-field">
          Название теста
          <input
            className="text-input"
            type="text"
            placeholder="Например: PHQ-9, GAD-7, тест тревоги"
            value={record.title}
            onChange={(event) => update({ title: event.target.value })}
            required
          />
        </label>
      </div>

      <label className="stacked-field">
        Результат
        <input
          className="text-input"
          type="text"
          placeholder="Например: 11/27, умеренная тревога, 42 балла"
          value={record.result}
          onChange={(event) => update({ result: event.target.value })}
        />
      </label>

      <label className="stacked-field">
        Ссылка на тест
        <input
          className="text-input"
          type="url"
          placeholder="https://..."
          value={record.url}
          onChange={(event) => update({ url: event.target.value })}
        />
      </label>

      <label className="stacked-field">
        Комментарий
        <textarea
          className="text-area"
          rows={2}
          placeholder="Что важно помнить про этот результат"
          value={record.notes}
          onChange={(event) => update({ notes: event.target.value })}
        />
      </label>

      <div className="stacked-field">
        <span>Скрин результата</span>
        <input className="test-file-input" type="file" accept="image/*" onChange={handleScreenshotChange} />
        {imageStatus && <p className="test-image-status">{imageStatus}</p>}
        {record.screenshot && (
          <div className="test-screenshot-preview">
            <img src={record.screenshot} alt="Скрин результата теста" />
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => update({ screenshot: '', screenshotName: '' })}
            >
              Убрать скрин
            </button>
          </div>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Сохраняю...' : 'Сохранить тест'}
        </button>
      </div>
    </form>
  )
}

export default function TestRecords({ records, onSave, onDelete, isSaving }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))

  const handleSave = async (record) => {
    const saved = await onSave(record)
    if (!saved) return
    setIsAdding(false)
    setEditingRecord(null)
  }

  return (
    <div className="test-page">
      <div className="test-header">
        <div>
          <h2>Тесты</h2>
          <p>Результаты опросников, ссылки и скрины, чтобы видеть динамику.</p>
        </div>
        {!isAdding && !editingRecord && (
          <button type="button" className="btn btn-primary btn-small" onClick={() => setIsAdding(true)}>
            Добавить
          </button>
        )}
      </div>

      {(isAdding || editingRecord) && (
        <TestForm
          key={editingRecord?.id || 'new-test-record'}
          initialRecord={editingRecord || makeEmptyTestRecord()}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false)
            setEditingRecord(null)
          }}
          isSaving={isSaving}
        />
      )}

      {!isAdding && !editingRecord && (
        sortedRecords.length === 0 ? (
          <div className="treatment-empty">Пока нет сохраненных тестов.</div>
        ) : (
          <ul className="test-list">
            {sortedRecords.map((record) => (
              <li key={record.id} className="test-item">
                <div className="test-item-main">
                  <div className="test-item-date">{formatDate(record.date)}</div>
                  <h3>{record.title}</h3>
                  {record.result && <p className="test-result">{record.result}</p>}
                  {record.notes && <p>{record.notes}</p>}
                  {(record.url || record.screenshot) && (
                    <div className="test-links">
                      {record.url && (
                        <a href={record.url} target="_blank" rel="noreferrer">
                          Открыть тест
                        </a>
                      )}
                      {record.screenshot && (
                        <a href={record.screenshot} target="_blank" rel="noreferrer">
                          Открыть скрин
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="test-actions">
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditingRecord(record)}>
                    Изменить
                  </button>
                  <button type="button" className="treatment-delete" onClick={() => onDelete(record.id)} aria-label="Удалить тест">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
