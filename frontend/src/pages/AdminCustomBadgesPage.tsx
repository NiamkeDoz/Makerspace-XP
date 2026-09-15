import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ApiError,
  adminCreateCustomBadge,
  adminDeleteCustomBadge,
  adminListCustomBadges,
  type CustomBadge,
} from '../lib/api'
import { ALL_BADGE_CATEGORIES, categoryLabel } from '../lib/badgeDescriptions'
import { ICON_KEYS, badgeIcon } from '../components/badgeIcons'

const TOKEN_STORAGE_KEY = 'admin_token'

export function AdminCustomBadgesPage() {
  const [token] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [badges, setBadges] = useState<CustomBadge[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<CustomBadge | null>(null)

  const [category, setCategory] = useState(ALL_BADGE_CATEGORIES[0].value)
  const [threshold, setThreshold] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState(ICON_KEYS[0])

  function load() {
    adminListCustomBadges(token)
      .then((result) => {
        setBadges(result)
        setError(null)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load custom badges.'))
  }

  useEffect(() => {
    if (token) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const thresholdNum = Number(threshold)
    if (!Number.isInteger(thresholdNum) || thresholdNum <= 0) {
      setError('Threshold must be a positive whole number.')
      return
    }
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.')
      return
    }
    setSaving(true)
    try {
      await adminCreateCustomBadge(token, {
        category,
        threshold: thresholdNum,
        name: name.trim(),
        description: description.trim(),
        icon,
      })
      setThreshold('')
      setName('')
      setDescription('')
      setIcon(ICON_KEYS[0])
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create badge.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(badge: CustomBadge) {
    setError(null)
    try {
      await adminDeleteCustomBadge(token, badge.id)
      setConfirmDelete(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete badge.')
    }
  }

  if (!token) {
    return (
      <section className="w-full max-w-2xl">
        <Link to="/admin" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Back to Admin
        </Link>
        <p className="text-sm text-[var(--text-muted)]">Unlock the Admin tab first, then come back here.</p>
      </section>
    )
  }

  return (
    <section className="w-full max-w-2xl">
      <Link to="/admin" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        ← Back to Admin
      </Link>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">Custom Badges</h2>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              {ALL_BADGE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
            Threshold
            <input
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 3"
              className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Badge name"
            className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown in the badge detail modal"
            rows={2}
            className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-[var(--text-faint)]">Icon</span>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
            {ICON_KEYS.map((key) => {
              const Icon = badgeIcon('', key)
              const selected = key === icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  title={key}
                  className="flex aspect-square items-center justify-center rounded-lg border transition-colors"
                  style={{
                    borderColor: selected ? '#f2cf72' : 'var(--border-strong)',
                    background: selected ? 'rgba(242, 207, 114, 0.12)' : 'var(--surface)',
                    color: selected ? '#f2cf72' : 'var(--text-muted)',
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-[var(--text-faint)]">
          Attendance/streak/weekly-streak badges are auto-awarded at tap-time, same as
          built-in ones, the moment a member crosses the threshold. Station badges join
          the existing station badges, which are manual-award-only for now.
        </p>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[var(--accent-text)] disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create badge'}
          </button>
        </div>
      </form>

      {badges === null && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {badges && badges.length === 0 && <p className="text-sm text-[var(--text-muted)]">No custom badges yet.</p>}

      {badges && badges.length > 0 && (
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
          {badges.map((badge) => {
            const Icon = badgeIcon(badge.name, badge.icon)
            return (
              <div
                key={badge.id}
                className="flex items-start justify-between gap-3 border-t py-3 text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'rgba(242, 207, 114, 0.12)', color: '#f2cf72' }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ color: '#f2cf72' }}>
                      {badge.name}{' '}
                      <span className="text-xs font-normal text-[var(--text-faint)]">
                        {categoryLabel(badge.category)} · threshold {badge.threshold}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{badge.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDelete(badge)}
                  className="shrink-0 rounded bg-[var(--surface-2)] px-2 py-1 text-xs font-medium hover:opacity-80"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setConfirmDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl border px-6 py-6 shadow-2xl"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-semibold tracking-tight">Delete badge?</h3>
            <p className="mb-5 text-sm text-[var(--text-muted)]">
              This removes <span style={{ color: '#f2cf72' }}>{confirmDelete.name}</span> from the catalog. Members
              who already earned it keep it — this only stops new members from earning it going forward.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded px-3 py-1.5 text-sm font-medium hover:opacity-80"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-80"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
