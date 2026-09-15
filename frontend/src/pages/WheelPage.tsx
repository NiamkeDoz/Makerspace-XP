import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, fetchMemberIdByTag, fetchWheelStatus, spinWheel, type SpinResult, type WheelStatus } from '../lib/api'

// Warm gold/amber ramp so the wheel matches the app's badge/XP branding regardless of
// theme; the "bust" segment gets a dim neutral so it visually reads as the letdown outcome.
const SEGMENT_COLORS = ['#f2cf72', '#d8a534', '#f6e2a0', '#b8860b', '#e0b84a', '#8a6d1a']
const BUST_COLOR = '#3f3f46'

const SPIN_DURATION_MS = 4200
const WHEEL_SIZE = 320
const WHEEL_TILT_DEG = 38 // static forward tilt — the "viewed from the front, mounted at
// an angle" Price Is Right look; the disc itself still spins on its own flat plane inside this.

function formatDate(isoDate: string): string {
  // isoDate is a plain YYYY-MM-DD (no time/timezone) — parse the parts directly into a
  // local Date rather than `new Date(isoDate)`, which treats it as UTC midnight and can
  // roll back a day once formatted in a timezone behind UTC.
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function WheelPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [tagInput, setTagInput] = useState('')
  const [activeId, setActiveId] = useState<number | null>(null)
  const [status, setStatus] = useState<WheelStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)

  function load(id: number) {
    setActiveId(id)
    setLoading(true)
    setError(null)
    setResult(null)
    fetchWheelStatus(id)
      .then(setStatus)
      .catch((err) => {
        setStatus(null)
        setError(err instanceof ApiError ? err.message : 'Member not found.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!memberId) return
    const id = Number(memberId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Invalid member link.')
      return
    }
    load(id)
  }, [memberId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const tagId = tagInput.trim()
    if (!tagId) {
      setError('Enter a tag ID.')
      setStatus(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const id = await fetchMemberIdByTag(tagId)
      load(id)
    } catch {
      setStatus(null)
      setError('No member with that tag ID.')
      setLoading(false)
    }
  }

  const segments = useMemo(() => {
    if (!status) return []
    const total = status.prizes.reduce((sum, p) => sum + p.weight, 0)
    let cursor = 0
    return status.prizes.map((prize, i) => {
      const startDeg = (cursor / total) * 360
      cursor += prize.weight
      const endDeg = (cursor / total) * 360
      return {
        ...prize,
        startDeg,
        endDeg,
        centerDeg: (startDeg + endDeg) / 2,
        color: prize.xp_amount === 0 ? BUST_COLOR : SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        shortLabel: prize.xp_amount === 0 ? '—' : String(prize.xp_amount),
      }
    })
  }, [status])

  const wheelBackground = useMemo(() => {
    if (segments.length === 0) return undefined
    const stops = segments.map((s) => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`)
    return `conic-gradient(from 0deg, ${stops.join(', ')})`
  }, [segments])

  async function handleSpin() {
    const id = activeId
    if (id === null || !status?.can_spin || spinning) return

    setSpinning(true)
    setError(null)
    setResult(null)
    try {
      const spinResult = await spinWheel(id)
      const won = segments.find((s) => s.label === spinResult.prize_label)
      const targetCenter = won ? won.centerDeg : 0
      // Land the winning segment's center under the fixed top pointer: since the wheel
      // rotates clockwise, the segment currently at `targetCenter` needs to travel
      // (360 - targetCenter) to reach 0deg (top). A few extra full turns, stacked onto
      // the wheel's current rotation (not reset to 0), keep the spin animating forward
      // every time instead of snapping backward.
      const jitter = (Math.random() - 0.5) * (won ? Math.min(won.endDeg - won.startDeg, 20) : 0)
      const extraTurns = 5 * 360
      setRotation((prev) => {
        const prevMod = prev % 360
        const delta = ((360 - targetCenter - prevMod) % 360 + 360) % 360
        return prev + delta + extraTurns + jitter
      })

      setTimeout(() => {
        setResult(spinResult)
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                can_spin: spinResult.bonus_spins > 0,
                next_spin_date: spinResult.used_bonus_spin ? prev.next_spin_date : spinResult.next_spin_date,
                bonus_spins: spinResult.bonus_spins,
                last_prize_label: spinResult.prize_label,
              }
            : prev,
        )
        setSpinning(false)
      }, SPIN_DURATION_MS)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Spin failed.')
      setSpinning(false)
    }
  }

  return (
    <section className="w-full max-w-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Spin the Wheel</h2>
        {memberId && (
          <button
            onClick={() => navigate('/wheel')}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)]"
          >
            Look up someone else
          </button>
        )}
      </div>

      {!memberId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tag ID"
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

      {status && (
        <div className="mt-6 flex flex-col items-center">
          {/* Perspective wrapper: the static forward tilt that gives the "mounted wheel
              viewed from the front" look. Everything inside (disc, pegs, pointer) shares it. */}
          <div style={{ perspective: 1200 }}>
            <div
              className="relative"
              style={{
                width: WHEEL_SIZE,
                height: WHEEL_SIZE,
                transform: `rotateX(${WHEEL_TILT_DEG}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Pointer/flapper — fixed at top, clicks against the pegs as the disc spins beneath it */}
              <div
                className="absolute left-1/2 -top-1 z-20 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '11px solid transparent',
                  borderRight: '11px solid transparent',
                  borderTop: '20px solid #f2cf72',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
                }}
              />

              {/* Rim */}
              <div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: '0 0 0 10px #171307, 0 0 0 12px #f2cf72, 0 18px 30px rgba(0,0,0,0.55)' }}
              />

              {/* Pegs — one at every wedge boundary, like the clickers on the real wheel */}
              {segments.map((s) => (
                <div
                  key={`peg-${s.label}-${s.startDeg}`}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `translate(-50%, -50%) rotate(${s.startDeg}deg)` }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -WHEEL_SIZE / 2 - 3,
                      left: -3,
                      width: 0,
                      height: 0,
                      borderLeft: '3px solid transparent',
                      borderRight: '3px solid transparent',
                      borderBottom: '7px solid #f2cf72',
                    }}
                  />
                </div>
              ))}

              {/* The spinning disc */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: wheelBackground,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.75, 0.25, 1)` : undefined,
                }}
              >
                {segments.map((s) => (
                  <div
                    key={`label-${s.label}-${s.startDeg}`}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: `translate(-50%, -50%) rotate(${s.centerDeg}deg)` }}
                  >
                    <span
                      className="absolute font-bold"
                      style={{
                        top: -WHEEL_SIZE / 2 + 18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 12,
                        color: s.xp_amount === 0 ? '#a1a1aa' : '#171307',
                      }}
                    >
                      {s.shortLabel}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hub */}
              <div
                className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{ background: '#171307', borderColor: '#f2cf72', boxShadow: '0 3px 6px rgba(0,0,0,0.6)' }}
              />
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={!status.can_spin || spinning}
            className="mt-6 rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-40"
          >
            {spinning
              ? 'Spinning…'
              : status.can_spin
                ? status.next_spin_date && status.bonus_spins > 0
                  ? 'Spin (bonus)'
                  : 'Spin'
                : 'Come back tomorrow'}
          </button>

          {status.bonus_spins > 0 && !spinning && (
            <p className="mt-2 text-xs" style={{ color: '#f2cf72' }}>
              {status.bonus_spins} bonus spin{status.bonus_spins === 1 ? '' : 's'} available
            </p>
          )}

          {!status.can_spin && !spinning && status.next_spin_date && (
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              Next spin available {formatDate(status.next_spin_date)}
              {status.last_prize_label && !result && <> · last time: {status.last_prize_label}</>}
            </p>
          )}

          {result && (
            <div className="mt-4 rounded-xl border px-5 py-4 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-lg font-semibold" style={{ color: '#f2cf72' }}>
                {result.prize_label}
              </p>
              {result.xp_awarded > 0 && (
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  +{result.xp_awarded} XP{result.leveled_up && <> · Leveled up to {result.level}!</>}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
