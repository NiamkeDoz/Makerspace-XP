import { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/api'

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
      .then(setEntries)
      .catch(() => setError('Could not load leaderboard.'))
  }, [])

  return (
    <section className="w-full">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Leaderboard</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && entries === null && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {entries && entries.length === 0 && <p className="text-sm text-[var(--text-muted)]">No members yet.</p>}

      {entries && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">Name</th>
                <th className="py-2 pr-2 font-medium">Points</th>
                <th className="py-2 font-medium">Streak</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.member_id} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-2 text-[var(--text-muted)]">{entry.rank}</td>
                  <td className="py-2 pr-2">{entry.name}</td>
                  <td className="py-2 pr-2">{entry.points_balance}</td>
                  <td className="py-2">{entry.current_streak}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
