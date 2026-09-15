import { useEffect, useState } from 'react'
import { ApiError, adminGetSettings, adminUpdateSettings } from '../lib/api'
import { THEMES, THEME_LABELS, type Theme } from '../lib/theme'

const TOKEN_STORAGE_KEY = 'admin_token'

interface ThemePanelProps {
  theme: Theme
  onSelect: (theme: Theme) => void
  onClose: () => void
}

export function ThemePanel({ theme, onSelect, onClose }: ThemePanelProps) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute right-0 top-0 flex h-full w-72 flex-col gap-4 border-l p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Theme
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-lg leading-none"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: t === theme ? 'var(--accent)' : 'var(--border)',
                background: t === theme ? 'var(--surface-2)' : 'transparent',
                color: 'var(--text)',
              }}
            >
              {THEME_LABELS[t]}
              {t === theme && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
        </div>

        <BackupsSection />
      </div>
    </div>
  )
}

function BackupsSection() {
  const [token] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    adminGetSettings(token)
      .then((settings) => setEnabled(settings.backups_enabled))
      .catch(() => setError('Could not load backup setting.'))
  }, [token])

  async function handleToggle() {
    if (enabled === null) return
    setSaving(true)
    setError(null)
    try {
      const result = await adminUpdateSettings(token, { backups_enabled: !enabled })
      setEnabled(result.backups_enabled)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
      <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
        Backups
      </h3>

      {!token && (
        <p className="text-xs text-[var(--text-faint)]">Unlock the Admin tab to manage nightly database backups.</p>
      )}

      {token && enabled === null && !error && <p className="text-xs text-[var(--text-faint)]">Loading…</p>}

      {token && enabled !== null && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <span>Nightly backups</span>
          <span
            className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
            style={{ background: enabled ? 'var(--accent)' : 'var(--surface-2)' }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </span>
        </button>
      )}

      <p className="mt-2 text-xs text-[var(--text-faint)]">
        Off by default. Requires the backup script to be scheduled on the host — see the
        pre-transfer checklist.
      </p>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
