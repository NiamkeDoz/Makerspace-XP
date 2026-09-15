import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, adminGetSettings, adminUpdateSettings, type AdminSettings } from '../lib/api'

const TOKEN_STORAGE_KEY = 'admin_token'

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

function windowStatus(settings: AdminSettings): { label: string; color: string } {
  if (!settings.double_xp_start || !settings.double_xp_end) return { label: 'Off', color: 'var(--text-faint)' }
  const now = Date.now()
  const start = new Date(settings.double_xp_start).getTime()
  const end = new Date(settings.double_xp_end).getTime()
  if (now < start) return { label: 'Scheduled', color: 'var(--text-muted)' }
  if (now > end) return { label: 'Ended', color: 'var(--text-faint)' }
  return { label: 'Active now', color: 'var(--accent)' }
}

export function AdminXpSettingsPage() {
  const [token] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [basePoints, setBasePoints] = useState('')
  const [xpStart, setXpStart] = useState('')
  const [xpEnd, setXpEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<'base' | 'window' | null>(null)

  function load() {
    adminGetSettings(token)
      .then((result) => {
        setSettings(result)
        setBasePoints(String(result.base_points))
        setXpStart(toDatetimeLocal(result.double_xp_start))
        setXpEnd(toDatetimeLocal(result.double_xp_end))
        setError(null)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load settings.'))
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  async function handleSaveBasePoints(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(null)
    const value = Number(basePoints)
    if (!Number.isFinite(value) || value < 1) {
      setError('Base points must be a positive number.')
      return
    }
    try {
      const result = await adminUpdateSettings(token, { base_points: value })
      setSettings(result)
      setSaved('base')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update settings.')
    }
  }

  async function handleSaveWindow(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(null)
    const start = fromDatetimeLocal(xpStart)
    const end = fromDatetimeLocal(xpEnd)
    if (start && end && start > end) {
      setError('Start must be before end.')
      return
    }
    try {
      const result = await adminUpdateSettings(token, { double_xp_start: start, double_xp_end: end })
      setSettings(result)
      setSaved('window')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update settings.')
    }
  }

  async function handleClearWindow() {
    setError(null)
    setSaved(null)
    try {
      const result = await adminUpdateSettings(token, { double_xp_start: null, double_xp_end: null })
      setSettings(result)
      setXpStart('')
      setXpEnd('')
      setSaved('window')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update settings.')
    }
  }

  if (!token) {
    return (
      <section className="w-full max-w-xl">
        <Link to="/admin" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Back to Admin
        </Link>
        <p className="text-sm text-[var(--text-muted)]">Unlock the Admin tab first, then come back here.</p>
      </section>
    )
  }

  return (
    <section className="w-full max-w-xl">
      <Link to="/admin" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        ← Back to Admin
      </Link>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">XP Settings</h2>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {!settings && !error && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}

      {settings && (
        <div className="flex flex-col gap-6">
          <form
            onSubmit={handleSaveBasePoints}
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
              XP per tap-in (base, before streak multiplier)
              <input
                type="number"
                min={1}
                value={basePoints}
                onChange={(e) => {
                  setBasePoints(e.target.value)
                  setSaved(null)
                }}
                className="w-32 rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)]"
              >
                Save
              </button>
              {saved === 'base' && <span className="text-xs text-[var(--text-muted)]">Saved.</span>}
            </div>
          </form>

          <form
            onSubmit={handleSaveWindow}
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text)]">Double XP window</p>
              <span className="text-xs font-medium" style={{ color: windowStatus(settings).color }}>
                {windowStatus(settings).label}
              </span>
            </div>
            <p className="mb-3 text-xs text-[var(--text-faint)]">
              While active, all XP/points earned on a tap-in are doubled — stacks with the
              streak multiplier rather than replacing it.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
                Starts
                <input
                  type="datetime-local"
                  value={xpStart}
                  onChange={(e) => {
                    setXpStart(e.target.value)
                    setSaved(null)
                  }}
                  className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
                Ends
                <input
                  type="datetime-local"
                  value={xpEnd}
                  onChange={(e) => {
                    setXpEnd(e.target.value)
                    setSaved(null)
                  }}
                  className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleClearWindow}
                className="rounded bg-[var(--surface-2)] px-3 py-1.5 text-sm font-medium hover:opacity-80"
              >
                Clear window
              </button>
              {saved === 'window' && <span className="text-xs text-[var(--text-muted)]">Saved.</span>}
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
