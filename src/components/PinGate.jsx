import { useState } from 'react'

const ACCESS_KEY = 'mood-diary-pin-access-v1'
const PIN_HASH = 'f81154e290634ba2713549346685173a6449f50c9d5db77f0b393e0de6f972d0'

async function sha256(value) {
  const data = new TextEncoder().encode(value)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function hasSavedAccess() {
  return localStorage.getItem(ACCESS_KEY) === 'ok'
}

export function clearSavedAccess() {
  localStorage.removeItem(ACCESS_KEY)
}

export default function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsChecking(true)

    try {
      const hash = await sha256(pin)
      if (hash !== PIN_HASH) {
        setError('Неверный PIN-код')
        return
      }

      localStorage.setItem(ACCESS_KEY, 'ok')
      onUnlock()
    } catch {
      setError('Не удалось проверить PIN-код')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <main className="pin-page">
      <form className="pin-panel" onSubmit={handleSubmit}>
        <h1>Дневник состояния</h1>
        <label className="pin-field">
          PIN-код
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />
        </label>
        {error && <p className="pin-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={isChecking || pin.length === 0}>
          {isChecking ? 'Проверяю...' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
