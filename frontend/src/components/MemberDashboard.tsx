import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeMedallion } from './BadgeMedallion'
import { BadgeModal, type BadgeModalData } from './BadgeModal'
import { fetchMember, fetchMemberBadges, type Badge, type CatalogBadge, type Member } from '../lib/api'
import { badgeDescription, type BadgeCategory } from '../lib/badgeDescriptions'
import { useCountUp } from '../lib/useCountUp'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function MemberDashboard() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [idInput, setIdInput] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [badges, setBadges] = useState<CatalogBadge[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    if (!member) return
    setFilled(false)
    // Two rAFs: the first lets the browser paint the 0% state, the second
    // flips to the real width so the transition actually has something to animate from.
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => setFilled(true))
      return () => cancelAnimationFrame(frame2)
    })
    return () => cancelAnimationFrame(frame1)
  }, [member?.id])

  useEffect(() => {
    if (!memberId) return
    const id = Number(memberId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Invalid member link.')
      setMember(null)
      setBadges(null)
      return
    }

    setLoading(true)
    setError(null)
    Promise.all([fetchMember(id), fetchMemberBadges(id)])
      .then(([memberResult, badgesResult]) => {
        setMember(memberResult)
        setBadges(badgesResult)
      })
      .catch(() => {
        setMember(null)
        setBadges(null)
        setError('Member not found.')
      })
      .finally(() => setLoading(false))
  }, [memberId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const id = Number(idInput)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid member ID.')
      setMember(null)
      setBadges(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [memberResult, badgesResult] = await Promise.all([fetchMember(id), fetchMemberBadges(id)])
      setMember(memberResult)
      setBadges(badgesResult)
    } catch {
      setMember(null)
      setBadges(null)
      setError('Member not found.')
    } finally {
      setLoading(false)
    }
  }

  const streakProgress = member && member.longest_streak > 0 ? Math.min(member.current_streak / member.longest_streak, 1) * 100 : 0
  const weeklyStreakProgress =
    member && member.longest_weekly_streak > 0
      ? Math.min(member.current_weekly_streak / member.longest_weekly_streak, 1) * 100
      : 0
  const xpProgress = member ? (member.xp_for_level === null ? 100 : (member.xp_into_level / member.xp_for_level) * 100) : 0
  const earnedBadgeCount = badges ? badges.filter((b) => b.earned).length : 0
  const totalBadgeCount = badges ? badges.length : 0
  const badgeProgress = totalBadgeCount > 0 ? (earnedBadgeCount / totalBadgeCount) * 100 : 0

  const xpDisplay = useCountUp(member?.xp_into_level ?? 0, { active: filled, delay: 0 })
  const streakDisplay = useCountUp(member?.current_streak ?? 0, { active: filled, delay: 80 })
  const weeklyStreakDisplay = useCountUp(member?.current_weekly_streak ?? 0, { active: filled, delay: 160 })
  const badgeCountDisplay = useCountUp(earnedBadgeCount, { active: filled, delay: 240 })
  const pointsDisplay = useCountUp(member?.points_balance ?? 0, { active: filled, delay: 320 })
  const longestStreakDisplay = useCountUp(member?.longest_streak ?? 0, { active: filled, delay: 360 })
  const totalVisitsDisplay = useCountUp(member?.total_visits ?? 0, { active: filled, delay: 400 })

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Member Dashboard</h2>
        {memberId && (
          <button
            onClick={() => {
              setMember(null)
              setError(null)
              navigate('/dashboard')
            }}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
          >
            Look up someone else
          </button>
        )}
      </div>

      {!memberId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="number"
            min={1}
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="Member ID"
            className="w-full rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)] disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Look up'}
          </button>
        </form>
      )}

      {memberId && loading && <p className="mt-3 text-sm text-[var(--text-muted)]">Loading…</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {member && (
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-amber-950">
              {initials(member.name)}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold">{member.name}</p>
              <p className="text-sm text-[var(--text-faint)]">Member since {formatDate(member.member_since)}</p>
            </div>
            {member.prestige_count > 0 && (
              <span className="shrink-0 rounded-lg bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-400">
                Prestige {member.prestige_count}
              </span>
            )}
          </div>

          <div className="mb-4 rounded-xl bg-[var(--surface)] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>Level {member.level}</span>
              <span>
                {member.xp_to_next === null ? 'Max level' : `${xpDisplay} / ${member.xp_for_level} xp`}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out"
                style={{ width: filled ? `${xpProgress}%` : '0%' }}
              />
            </div>
            {member.xp_to_next !== null && (
              <p className="mt-2 text-xs text-[var(--text-faint)]">{member.xp_to_next} xp to level {member.level + 1}</p>
            )}
          </div>

          <div className="mb-4 rounded-xl bg-[var(--surface)] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>Current streak</span>
              <span>
                {streakDisplay}d{member.longest_streak > 0 ? ` / best ${member.longest_streak}d` : ''}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-700 ease-out"
                style={{ width: filled ? `${streakProgress}%` : '0%' }}
              />
            </div>
          </div>

          <div className="mb-4 rounded-xl bg-[var(--surface)] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>Weekly streak</span>
              <span>
                {weeklyStreakDisplay}wk
                {member.longest_weekly_streak > 0 ? ` / best ${member.longest_weekly_streak}wk` : ''}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-700 ease-out"
                style={{ width: filled ? `${weeklyStreakProgress}%` : '0%' }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              At least one check-in every week — independent of the daily streak
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="mb-1 text-xs text-[var(--text-faint)]">Points balance</p>
              <p className="text-2xl font-semibold tabular-nums">{pointsDisplay}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="mb-1 text-xs text-[var(--text-faint)]">Longest streak</p>
              <p className="text-2xl font-semibold tabular-nums">{longestStreakDisplay}d</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="mb-1 text-xs text-[var(--text-faint)]">Total visits</p>
              <p className="text-2xl font-semibold tabular-nums">{totalVisitsDisplay}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="mb-1 text-xs text-[var(--text-faint)]">Last tap</p>
              <p className="text-2xl font-semibold">{member.last_tap_date ? formatDate(member.last_tap_date) : '—'}</p>
            </div>
          </div>

          {badges && totalBadgeCount > 0 && (
            <div className="mb-4 mt-3 rounded-xl bg-[var(--surface)] px-5 py-5">
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>Badges earned</span>
                <span>
                  {badgeCountDisplay} / {totalBadgeCount}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out"
                  style={{ width: filled ? `${badgeProgress}%` : '0%' }}
                />
              </div>
            </div>
          )}

          <BadgeRow member={member} />
        </div>
      )}
    </section>
  )
}

function BadgeRow({ member }: { member: Member }) {
  const [selected, setSelected] = useState<BadgeModalData | null>(null)

  const earned = [
    ...member.attendance_badges.map((b) => ({ ...b, category: 'attendance' as const })),
    ...member.streak_badges.map((b) => ({ ...b, category: 'streak' as const })),
    ...member.weekly_streak_badges.map((b) => ({ ...b, category: 'weekly_streak' as const })),
  ].sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())

  const next = (
    [
      member.next_attendance_badge && { ...member.next_attendance_badge, category: 'attendance' as const },
      member.next_streak_badge && { ...member.next_streak_badge, category: 'streak' as const },
      member.next_weekly_streak_badge && { ...member.next_weekly_streak_badge, category: 'weekly_streak' as const },
    ] as const
  ).filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined)

  if (earned.length === 0 && next.length === 0) return null

  return (
    <div className="mt-4">
      <p className="mb-3 text-sm text-[var(--text-muted)]">Badges</p>
      <div className="flex flex-wrap gap-x-3 gap-y-4">
        {earned.map((badge: Badge & { category: BadgeCategory }) => (
          <BadgeMedallion
            key={badge.name}
            name={badge.name}
            earned
            caption={formatDate(badge.earned_at)}
            onClick={() =>
              setSelected({
                name: badge.name,
                earned: true,
                description: badgeDescription(badge.category, badge.threshold),
                caption: formatDate(badge.earned_at),
              })
            }
          />
        ))}
        {next.map((badge) => (
          <BadgeMedallion
            key={badge.name}
            name={badge.name}
            earned={false}
            caption={`${badge.remaining} to go`}
            onClick={() =>
              setSelected({
                name: badge.name,
                earned: false,
                description: badgeDescription(badge.category, badge.threshold),
                caption: `${badge.remaining} to go`,
                progress: { current: badge.threshold - badge.remaining, threshold: badge.threshold },
              })
            }
          />
        ))}
      </div>

      <Link
        to={`/dashboard/${member.id}/badges`}
        className="mt-3 inline-block text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
      >
        Show more →
      </Link>

      {selected && <BadgeModal badge={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
