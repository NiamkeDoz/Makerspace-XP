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
    <section className="w-full max-w-lg">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Leaderboard</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && entries === null && <p className="text-sm text-neutral-400">Loading…</p>}
      {entries && entries.length === 0 && <p className="text-sm text-neutral-400">No members yet.</p>}

      {entries && entries.length > 0 && (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Name</th>
              <th className="py-2 pr-2 font-medium">Points</th>
              <th className="py-2 font-medium">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.member_id} className="border-b border-neutral-900">
                <td className="py-2 pr-2 text-neutral-400">{entry.rank}</td>
                <td className="py-2 pr-2">{entry.name}</td>
                <td className="py-2 pr-2">{entry.points_balance}</td>
                <td className="py-2">{entry.current_streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
