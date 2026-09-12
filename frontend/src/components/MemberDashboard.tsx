import { useState, type FormEvent } from 'react'
import { BadgeMedallion } from './BadgeMedallion'
import { fetchMember, type Badge, type Member } from '../lib/api'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function MemberDashboard() {
  const [idInput, setIdInput] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const id = Number(idInput)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid member ID.')
      setMember(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setMember(await fetchMember(id))
    } catch {
      setMember(null)
      setError('Member not found.')
    } finally {
      setLoading(false)
    }
  }

  const streakProgress = member && member.longest_streak > 0 ? Math.min(member.current_streak / member.longest_streak, 1) * 100 : 0
  const xpProgress = member ? (member.xp_for_level === null ? 100 : (member.xp_into_level / member.xp_for_level) * 100) : 0

  return (
    <section className="w-full max-w-lg">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Member Dashboard</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          min={1}
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Member ID"
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {member && (
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-amber-950">
              {initials(member.name)}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold">{member.name}</p>
              <p className="text-sm text-neutral-500">Member since {formatDate(member.member_since)}</p>
            </div>
            {member.prestige_count > 0 && (
              <span className="shrink-0 rounded-lg bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-400">
                Prestige {member.prestige_count}
              </span>
            )}
          </div>

          <div className="mb-4 rounded-xl bg-neutral-900 px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-neutral-400">
              <span>Level {member.level}</span>
              <span>
                {member.xp_to_next === null ? 'Max level' : `${member.xp_into_level} / ${member.xp_for_level} xp`}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-950">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            {member.xp_to_next !== null && (
              <p className="mt-2 text-xs text-neutral-500">{member.xp_to_next} xp to level {member.level + 1}</p>
            )}
          </div>

          <div className="mb-4 rounded-xl bg-neutral-900 px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-neutral-400">
              <span>Current streak</span>
              <span>
                {member.current_streak}d{member.longest_streak > 0 ? ` / best ${member.longest_streak}d` : ''}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-950">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${streakProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-900 px-4 py-3">
              <p className="mb-1 text-xs text-neutral-500">Points balance</p>
              <p className="text-2xl font-semibold">{member.points_balance}</p>
            </div>
            <div className="rounded-xl bg-neutral-900 px-4 py-3">
              <p className="mb-1 text-xs text-neutral-500">Longest streak</p>
              <p className="text-2xl font-semibold">{member.longest_streak}d</p>
            </div>
            <div className="rounded-xl bg-neutral-900 px-4 py-3">
              <p className="mb-1 text-xs text-neutral-500">Total visits</p>
              <p className="text-2xl font-semibold">{member.total_visits}</p>
            </div>
            <div className="rounded-xl bg-neutral-900 px-4 py-3">
              <p className="mb-1 text-xs text-neutral-500">Last tap</p>
              <p className="text-2xl font-semibold">{member.last_tap_date ? formatDate(member.last_tap_date) : '—'}</p>
            </div>
          </div>

          <BadgeRow member={member} />
        </div>
      )}
    </section>
  )
}

function BadgeRow({ member }: { member: Member }) {
  const earned = [...member.attendance_badges, ...member.streak_badges].sort(
    (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime(),
  )
  const next = [member.next_attendance_badge, member.next_streak_badge].filter((b): b is NonNullable<typeof b> => b !== null)

  if (earned.length === 0 && next.length === 0) return null

  return (
    <div className="mt-4">
      <p className="mb-3 text-sm text-neutral-400">Badges</p>
      <div className="flex flex-wrap gap-x-3 gap-y-4">
        {earned.map((badge: Badge) => (
          <BadgeMedallion key={badge.name} name={badge.name} earned caption={formatDate(badge.earned_at)} />
        ))}
        {next.map((badge) => (
          <BadgeMedallion key={badge.name} name={badge.name} earned={false} caption={`${badge.remaining} to go`} />
        ))}
      </div>
    </div>
  )
}
