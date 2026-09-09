import { useEffect, useState } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { Leaderboard } from './components/Leaderboard'
import { MemberDashboard } from './components/MemberDashboard'
import { TapSimulator } from './components/TapSimulator'
import { checkHealth } from './lib/api'

function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkHealth().then(setApiOnline)
  }, [])

  return (
    <div className="min-h-screen px-4 py-10">
      <header className="mb-8 flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Makerspace XP</h1>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              apiOnline === null
                ? 'bg-neutral-600'
                : apiOnline
                  ? 'bg-emerald-500'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-neutral-400">
            {apiOnline === null ? 'Checking API…' : apiOnline ? 'API online' : 'API unreachable'}
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center gap-10">
        <Leaderboard />
        <TapSimulator />
        <MemberDashboard />
        <AdminPanel />
      </main>
    </div>
  )
}

export default App
