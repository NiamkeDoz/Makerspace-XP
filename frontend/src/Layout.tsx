import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { checkHealth } from './lib/api'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`

export function Layout() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkHealth().then(setApiOnline)
  }, [])

  return (
    <div className="min-h-screen px-4 py-10">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Makerspace XP</h1>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              apiOnline === null ? 'bg-neutral-600' : apiOnline ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span className="text-neutral-400">
            {apiOnline === null ? 'Checking API…' : apiOnline ? 'API online' : 'API unreachable'}
          </span>
        </div>
        <nav className="flex flex-wrap justify-center gap-1 rounded-lg border border-neutral-800 p-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Member Dashboard
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center gap-10">
        <Outlet />
      </main>
    </div>
  )
}
