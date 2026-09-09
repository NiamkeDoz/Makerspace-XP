import { useEffect, useState } from 'react'
import { checkHealth } from './lib/api'

function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkHealth().then(setApiOnline)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Makerspace XP</h1>
      <p className="text-neutral-400">Member dashboard — under construction.</p>
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
    </div>
  )
}

export default App
