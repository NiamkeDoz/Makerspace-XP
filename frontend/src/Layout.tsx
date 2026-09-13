import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ThemePanel } from './components/ThemePanel'
import { checkHealth } from './lib/api'
import { useTheme } from './lib/theme'

function navLinkStyle({ isActive }: { isActive: boolean }) {
  return {
    background: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
  }
}

export function Layout() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [themeOpen, setThemeOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    checkHealth().then(setApiOnline)
  }, [])

  return (
    <div className="min-h-screen px-4 py-10">
      <button
        type="button"
        onClick={() => setThemeOpen(true)}
        aria-label="Open theme settings"
        className="fixed right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {themeOpen && (
        <ThemePanel
          theme={theme}
          onSelect={(t) => {
            setTheme(t)
            setThemeOpen(false)
          }}
          onClose={() => setThemeOpen(false)}
        />
      )}

      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Makerspace XP</h1>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              apiOnline === null ? 'bg-neutral-500' : apiOnline ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span style={{ color: 'var(--text-muted)' }}>
            {apiOnline === null ? 'Checking API…' : apiOnline ? 'API online' : 'API unreachable'}
          </span>
        </div>
        <nav
          className="flex flex-wrap justify-center gap-1 rounded-lg border p-1"
          style={{ borderColor: 'var(--border)' }}
        >
          <NavLink to="/" end className="rounded px-3 py-1.5 text-sm font-medium" style={navLinkStyle}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className="rounded px-3 py-1.5 text-sm font-medium" style={navLinkStyle}>
            Member Dashboard
          </NavLink>
          <NavLink to="/admin" className="rounded px-3 py-1.5 text-sm font-medium" style={navLinkStyle}>
            Admin
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center gap-10">
        <Outlet />
      </main>
    </div>
  )
}
