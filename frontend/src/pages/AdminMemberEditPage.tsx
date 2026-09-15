import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  adminAdjustMember,
  adminAwardBadge,
  adminGetMember,
  adminGetMemberBadges,
  adminReassignTag,
  adminRevokeBadge,
  type AdminCatalogBadge,
  type AdminMember,
} from '../lib/api'
import { badgeDescription, STATION_LABELS } from '../lib/badgeDescriptions'
import { BadgeIconCircle } from '../components/BadgeIconCircle'

const TOKEN_STORAGE_KEY = 'admin_token'

const CATEGORY_LABELS: Record<string, string> = {
  attendance: 'Attendance',
  streak: 'Streak',
  weekly_streak: 'Weekly Streak',
}

function categoryLabel(category: string): string {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category]
  if (category.startsWith('station_')) return STATION_LABELS[category.slice('station_'.length)] ?? category
  return category
}

function formatDate(iso: string): string {
  // A bare YYYY-MM-DD (no time/timezone, e.g. last_tap_date) is parsed by `new Date()` as
  // UTC midnight — formatting that in a timezone behind UTC can roll it back a day. Parse
  // date-only strings as local Y/M/D directly; full ISO datetimes parse fine as-is.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

type FormState = {
  name: string
  discord_username: string
  member_since: string
  points_balance: string
  current_streak: string
  longest_streak: string
  current_weekly_streak: string
  longest_weekly_streak: string
  xp: string
  level: string
  lifetime_xp: string
  prestige_count: string
  bonus_spins: string
}

function toFormState(member: AdminMember): FormState {
  return {
    name: member.name,
    discord_username: member.discord_username ?? '',
    member_since: member.created_at.slice(0, 10),
    points_balance: String(member.points_balance),
    current_streak: String(member.current_streak),
    longest_streak: String(member.longest_streak),
    current_weekly_streak: String(member.current_weekly_streak),
    longest_weekly_streak: String(member.longest_weekly_streak),
    xp: String(member.xp),
    level: String(member.level),
    lifetime_xp: String(member.lifetime_xp),
    prestige_count: String(member.prestige_count),
    bonus_spins: String(member.bonus_spins),
  }
}

function field(
  label: string,
  key: keyof FormState,
  form: FormState,
  setForm: (updater: (prev: FormState) => FormState) => void,
  type: 'text' | 'number' | 'date' = 'number',
) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
      />
    </label>
  )
}

export function AdminMemberEditPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [token] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [member, setMember] = useState<AdminMember | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [tagId, setTagId] = useState('')
  const [tagSaving, setTagSaving] = useState(false)
  const [tagSaved, setTagSaved] = useState(false)
  const [tagError, setTagError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const id = Number(memberId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Invalid member link.')
      return
    }
    adminGetMember(token, id)
      .then((result) => {
        setMember(result)
        setForm(toFormState(result))
        setTagId(result.tag_id)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load member.'))
  }, [token, memberId])

  async function handleSaveTag(e: FormEvent) {
    e.preventDefault()
    if (!member) return
    setTagError(null)
    setTagSaved(false)
    const trimmed = tagId.trim()
    if (!trimmed) {
      setTagError('Tag ID is required.')
      return
    }
    if (trimmed === member.tag_id) {
      setTagError('That’s already this member’s current tag.')
      return
    }
    setTagSaving(true)
    try {
      const result = await adminReassignTag(token, member.id, trimmed)
      setMember(result)
      setTagId(result.tag_id)
      setTagSaved(true)
    } catch (err) {
      setTagError(err instanceof ApiError ? err.message : 'Failed to update tag.')
    } finally {
      setTagSaving(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!member || !form) return
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const result = await adminAdjustMember(token, member.id, {
        name: form.name.trim(),
        discord_username: form.discord_username.trim(),
        member_since: form.member_since,
        points_balance: Number(form.points_balance),
        current_streak: Number(form.current_streak),
        longest_streak: Number(form.longest_streak),
        current_weekly_streak: Number(form.current_weekly_streak),
        longest_weekly_streak: Number(form.longest_weekly_streak),
        xp: Number(form.xp),
        level: Number(form.level),
        lifetime_xp: Number(form.lifetime_xp),
        prestige_count: Number(form.prestige_count),
        bonus_spins: Number(form.bonus_spins),
      })
      setMember(result)
      setForm(toFormState(result))
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (!token) {
    return (
      <section className="w-full max-w-3xl">
        <Link to="/admin" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Back to Admin
        </Link>
        <p className="text-sm text-[var(--text-muted)]">Unlock the Admin tab first, then come back here.</p>
      </section>
    )
  }

  return (
    <section className="w-full max-w-5xl">
      <div className="mb-3 flex items-center justify-between">
        <Link to="/admin" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Back to Admin
        </Link>
        {member && (
          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
          >
            Done
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {!error && !member && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}

      {member && form && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Edit {member.name}</h2>
            <p className="text-xs text-[var(--text-faint)]">
              Member since {formatDate(member.created_at)}
              {member.last_tap_date && <> · Last tap {formatDate(member.last_tap_date)}</>}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <form onSubmit={handleSaveTag} className="flex flex-col gap-1">
                <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
                  Tag ID
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagId}
                      onChange={(e) => {
                        setTagId(e.target.value)
                        setTagSaved(false)
                      }}
                      className="flex-1 rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="submit"
                      disabled={tagSaving}
                      className="shrink-0 rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)] disabled:opacity-50"
                    >
                      {tagSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </label>
                <p className="text-xs text-[var(--text-faint)]">
                  For a lost card. The old tag is retired — if it's tapped again, it's rejected
                  instead of enrolling a new member.
                </p>
                {tagError && <p className="text-xs text-red-400">{tagError}</p>}
                {tagSaved && <p className="text-xs text-[var(--text-muted)]">Saved.</p>}
              </form>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {field('Name', 'name', form, setForm, 'text')}
                <div>
                  {field('Discord username', 'discord_username', form, setForm, 'text')}
                  <p className="mt-1 text-xs text-[var(--text-faint)]">
                    Collected ahead of the future Discord bot integration — used for DM
                    notifications once that's built. Not verified or linked to a real account.
                  </p>
                </div>
                <div>
                  {field('Member since', 'member_since', form, setForm, 'date')}
                  <p className="mt-1 text-xs text-[var(--text-faint)]">
                    Backdate or correct enrollment date — e.g. someone who attended before
                    getting a tag.
                  </p>
                </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text)]">Points &amp; leveling</p>
                <div className="grid grid-cols-2 gap-3">
                  {field('Points balance', 'points_balance', form, setForm)}
                  {field('XP', 'xp', form, setForm)}
                  {field('Level', 'level', form, setForm)}
                  {field('Lifetime XP', 'lifetime_xp', form, setForm)}
                  {field('Prestige count', 'prestige_count', form, setForm)}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text)]">Spin the Wheel</p>
                <div className="grid grid-cols-2 gap-3">{field('Bonus spins', 'bonus_spins', form, setForm)}</div>
                <p className="mt-1 text-xs text-[var(--text-faint)]">
                  Extra spins usable even if they already spun today — e.g. a makeup for a
                  missed day, or an event prize. Consumed after the free daily spin.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text)]">Streaks</p>
                <div className="grid grid-cols-2 gap-3">
                  {field('Current streak (days)', 'current_streak', form, setForm)}
                  {field('Longest streak (days)', 'longest_streak', form, setForm)}
                  {field('Current weekly streak', 'current_weekly_streak', form, setForm)}
                  {field('Longest weekly streak', 'longest_weekly_streak', form, setForm)}
                </div>
              </div>

              <p className="text-xs text-[var(--text-faint)]">
                Setting XP recomputes level to match, unless you also change level yourself in the
                same save — for fixing mistakes, not routine play.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[var(--accent-text)] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {saved && <span className="text-xs text-[var(--text-muted)]">Saved.</span>}
              </div>
              </form>
            </div>

            <BadgesManager token={token} memberId={member.id} />
          </div>
        </>
      )}
    </section>
  )
}

const BADGES_PAGE_SIZE = 8

function BadgesManager({ token, memberId }: { token: string; memberId: number }) {
  const [badges, setBadges] = useState<AdminCatalogBadge[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [confirmTarget, setConfirmTarget] = useState<AdminCatalogBadge | null>(null)

  function load() {
    adminGetMemberBadges(token, memberId)
      .then((result) => {
        setBadges(result)
        setError(null)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load badges.'))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  async function handleAward(badge: AdminCatalogBadge) {
    const key = `${badge.category}:${badge.threshold}`
    setPendingKey(key)
    setError(null)
    try {
      await adminAwardBadge(token, memberId, badge.category, badge.threshold)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to award badge.')
    } finally {
      setPendingKey(null)
    }
  }

  async function handleRevoke(badge: AdminCatalogBadge) {
    if (badge.id === null) return
    const key = `${badge.category}:${badge.threshold}`
    setPendingKey(key)
    setError(null)
    try {
      await adminRevokeBadge(token, memberId, badge.id)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to revoke badge.')
    } finally {
      setPendingKey(null)
      setConfirmTarget(null)
    }
  }

  if (error) return <p className="mt-6 text-sm text-red-400">{error}</p>
  if (!badges) return <p className="mt-6 text-sm text-[var(--text-muted)]">Loading badges…</p>

  const categories = Array.from(new Set(badges.map((b) => b.category)))
  const filtered = categoryFilter === 'all' ? badges : badges.filter((b) => b.category === categoryFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / BADGES_PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pagedBadges = filtered.slice((pageClamped - 1) * BADGES_PAGE_SIZE, pageClamped * BADGES_PAGE_SIZE)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--text)]">Badges</p>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
        {pagedBadges.map((badge) => {
          const key = `${badge.category}:${badge.threshold}`
          return (
            <div
              key={key}
              className="group relative flex items-center justify-between border-t py-2 text-sm first:border-t-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <span style={{ color: badge.earned ? '#f2cf72' : 'var(--text)' }}>{badge.name}</span>
                <span className="ml-2 text-xs text-[var(--text-faint)]">
                  {categoryLabel(badge.category)} · {badge.earned ? 'Earned' : `${badge.remaining} to go`}
                </span>
              </div>

              <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 items-center gap-3 rounded-xl border p-3 shadow-2xl group-hover:flex" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <BadgeIconCircle name={badge.name} earned={badge.earned} icon={badge.icon} size={56} ringWidth={3} className="shrink-0" />
                <div>
                  <p className="text-sm font-medium" style={{ color: badge.earned ? '#f2cf72' : 'var(--text)' }}>
                    {badge.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {badge.description ?? badgeDescription(badge.category, badge.threshold)}
                  </p>
                </div>
              </div>

              {badge.earned ? (
                <button
                  onClick={() => setConfirmTarget(badge)}
                  disabled={pendingKey === key}
                  className="rounded bg-[var(--surface-2)] px-2 py-1 text-xs font-medium hover:opacity-80 disabled:opacity-50"
                >
                  Revoke
                </button>
              ) : (
                <button
                  onClick={() => handleAward(badge)}
                  disabled={pendingKey === key}
                  className="rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-[var(--accent-text)] hover:opacity-80 disabled:opacity-50"
                >
                  Award
                </button>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-xs text-[var(--text-faint)]">
            {(pageClamped - 1) * BADGES_PAGE_SIZE + 1}–{Math.min(pageClamped * BADGES_PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageClamped === 1}
              className="rounded bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              Page {pageClamped} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageClamped === totalPages}
              className="rounded bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {confirmTarget && (
        <RevokeConfirmModal
          badge={confirmTarget}
          pending={pendingKey === `${confirmTarget.category}:${confirmTarget.threshold}`}
          onConfirm={() => handleRevoke(confirmTarget)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

function RevokeConfirmModal({
  badge,
  pending,
  onConfirm,
  onClose,
}: {
  badge: AdminCatalogBadge
  pending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl border px-6 py-6 shadow-2xl"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold tracking-tight">Revoke badge?</h3>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          This removes <span style={{ color: '#f2cf72' }}>{badge.name}</span> ({categoryLabel(badge.category)}) from
          this member. It'll re-award automatically if they cross the threshold again later.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm font-medium hover:opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50"
          >
            {pending ? 'Revoking…' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  )
}
