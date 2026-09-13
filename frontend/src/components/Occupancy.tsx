import { useEffect, useState } from 'react'
import { fetchOccupancy, type OccupancyEntry } from '../lib/api'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function Occupancy() {
  const [entries, setEntries] = useState<OccupancyEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    fetchOccupancy()
      .then(setEntries)
      .catch(() => setError('Could not load occupancy.'))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="w-full">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Currently In</h2>
        {entries && <span className="text-sm text-[var(--text-faint)]">{entries.length} here</span>}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && entries === null && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {entries && entries.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nobody currently checked in.</p>}

      {entries && entries.length > 0 && (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {entries.map((entry) => (
            <li key={entry.member_id} className="flex items-center justify-between py-2 text-sm">
              <span>{entry.name}</span>
              <span className="text-[var(--text-faint)]">since {formatTime(entry.check_in)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
