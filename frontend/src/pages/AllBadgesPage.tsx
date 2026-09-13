import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeMedallion } from '../components/BadgeMedallion'
import { BadgeModal, type BadgeModalData } from '../components/BadgeModal'
import { badgeDescription, type BadgeCategory } from '../lib/badgeDescriptions'
import { fetchMember, fetchMemberBadges, type CatalogBadge, type Member } from '../lib/api'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function CategorySection({ title, badges }: { title: string; badges: CatalogBadge[] }) {
  const [selected, setSelected] = useState<BadgeModalData | null>(null)
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <section className="w-full">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <span className="text-sm text-[var(--text-faint)]">
          {earnedCount} / {badges.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-4">
        {badges.map((badge) => {
          const caption = badge.earned && badge.earned_at ? formatDate(badge.earned_at) : `${badge.remaining} to go`
          return (
            <BadgeMedallion
              key={badge.name}
              name={badge.name}
              earned={badge.earned}
              caption={caption}
              onClick={() =>
                setSelected({
                  name: badge.name,
                  earned: badge.earned,
                  description: badgeDescription(badge.category as BadgeCategory, badge.threshold),
                  caption,
                  progress:
                    !badge.earned && badge.remaining !== null
                      ? { current: badge.threshold - badge.remaining, threshold: badge.threshold }
                      : undefined,
                })
              }
            />
          )
        })}
      </div>
      {selected && <BadgeModal badge={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}

export function AllBadgesPage() {
  const { memberId } = useParams()
  const [member, setMember] = useState<Member | null>(null)
  const [badges, setBadges] = useState<CatalogBadge[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(memberId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Invalid member ID.')
      return
    }
    Promise.all([fetchMember(id), fetchMemberBadges(id)])
      .then(([m, b]) => {
        setMember(m)
        setBadges(b)
      })
      .catch(() => setError('Could not load badges.'))
  }, [memberId])

  return (
    <section className="w-full max-w-3xl">
      <Link to="/dashboard" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        ← Back to dashboard
      </Link>

      <h1 className="mb-1 text-lg font-semibold tracking-tight">All Badges</h1>
      {member && <p className="mb-6 text-sm text-[var(--text-faint)]">{member.name}</p>}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && badges === null && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}

      {badges && (
        <div className="flex flex-col gap-8">
          <CategorySection title="Attendance" badges={badges.filter((b) => b.category === 'attendance')} />
          <CategorySection title="Streak" badges={badges.filter((b) => b.category === 'streak')} />
          <CategorySection title="Weekly Streak" badges={badges.filter((b) => b.category === 'weekly_streak')} />
        </div>
      )}
    </section>
  )
}
