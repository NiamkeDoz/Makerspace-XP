import { THEMES, THEME_LABELS, type Theme } from '../lib/theme'

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
      </div>
    </div>
  )
}
