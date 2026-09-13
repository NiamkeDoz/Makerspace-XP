import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/api'
import { useCountUp } from '../lib/useCountUp'

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'chart' | 'table'>('chart')

  useEffect(() => {
    fetchLeaderboard(10)
      .then(setEntries)
      .catch(() => setError('Could not load leaderboard.'))
  }, [])

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Leaderboard</h2>
        {entries && entries.length > 0 && (
          <button
            type="button"
            onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
          >
            {view === 'chart' ? 'View as table' : 'View as chart'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && entries === null && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {entries && entries.length === 0 && <p className="text-sm text-[var(--text-muted)]">No members yet.</p>}

      {entries && entries.length > 0 && view === 'chart' && <LeaderboardChart entries={entries} />}
      {entries && entries.length > 0 && view === 'table' && <LeaderboardTable entries={entries} />}
    </section>
  )
}

function LeaderboardChart({ entries }: { entries: LeaderboardEntry[] }) {
  const maxPoints = Math.max(1, ...entries.map((e) => e.points_balance))
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    setFilled(false)
    // Two rAFs: the first lets the browser paint the 0% state, the second
    // flips to the real width so the transition actually has something to animate from.
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => setFilled(true))
      return () => cancelAnimationFrame(frame2)
    })
    return () => cancelAnimationFrame(frame1)
  }, [entries])

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => (
        <LeaderboardBar key={entry.member_id} entry={entry} widthPct={(entry.points_balance / maxPoints) * 100} delay={i * 40} filled={filled} />
      ))}
    </div>
  )
}

function LeaderboardBar({
  entry,
  widthPct,
  delay,
  filled,
}: {
  entry: LeaderboardEntry
  widthPct: number
  delay: number
  filled: boolean
}) {
  const displayPoints = useCountUp(entry.points_balance, { delay, active: filled })

  return (
    <Link
      to={`/dashboard/${entry.member_id}`}
      className="group flex items-center gap-3 rounded py-1.5 px-1 -mx-1 hover:bg-[var(--surface)]"
      title={`${entry.name} — ${entry.points_balance} pts, ${entry.current_streak}d streak`}
    >
      <span className="w-5 shrink-0 text-right text-xs text-[var(--text-faint)] tabular-nums">{entry.rank}</span>
      <span className="w-28 shrink-0 truncate text-sm sm:w-36">{entry.name}</span>
      <div className="h-[18px] flex-1 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="h-full rounded-r-[4px] bg-[var(--accent)] transition-[width] duration-700 ease-out group-hover:opacity-80"
          style={{ width: filled ? `${widthPct}%` : '0%', transitionDelay: `${delay}ms` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm tabular-nums">{displayPoints}</span>
      <span className="w-10 shrink-0 text-right text-xs text-[var(--text-faint)] tabular-nums">
        {entry.current_streak}d
      </span>
    </Link>
  )
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const navigate = useNavigate()
  return (
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
            <tr
              key={entry.member_id}
              onClick={() => navigate(`/dashboard/${entry.member_id}`)}
              className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--surface)]"
            >
              <td className="py-2 pr-2 text-[var(--text-muted)]">{entry.rank}</td>
              <td className="py-2 pr-2">{entry.name}</td>
              <td className="py-2 pr-2">{entry.points_balance}</td>
              <td className="py-2">{entry.current_streak}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
