import { useState, type FormEvent } from 'react'
import { submitTap, type TapResult } from '../lib/api'

const READER_ID = 'kiosk-sim'

export function TapSimulator() {
  const [tagId, setTagId] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [result, setResult] = useState<TapResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function doTap(name?: string) {
    if (!tagId.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await submitTap(tagId.trim(), READER_ID, name)
      setResult(res)
      if (res.status === 'unknown_tag') {
        setNeedsName(true)
      } else {
        setNeedsName(false)
        setNameInput('')
      }
    } catch {
      setError('Tap failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleTapSubmit(e: FormEvent) {
    e.preventDefault()
    setResult(null)
    setNeedsName(false)
    doTap()
  }

  function handleEnrollSubmit(e: FormEvent) {
    e.preventDefault()
    doTap(nameInput.trim())
  }

  const statusCopy: Record<string, string> = {
    recorded: 'Checked in.',
    duplicate: 'Checked in (already earned today’s points).',
    enrolled: 'New member enrolled and checked in.',
    unknown_tag: 'Unknown tag — enter a name to enroll.',
    checked_out: 'Checked out.',
  }

  return (
    <section className="w-full max-w-2xl">
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Tap Simulator</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Stands in for the ESP32 + PN532 reader, which isn't assembled yet.
      </p>

      <form onSubmit={handleTapSubmit} className="flex gap-2">
        <input
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          placeholder="Tag ID"
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          Tap
        </button>
      </form>

      {needsName && (
        <form onSubmit={handleEnrollSubmit} className="mt-3 flex gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name for new member"
            required
            autoFocus
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Enroll &amp; tap
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-3 text-sm">
          <p className="text-neutral-300">{statusCopy[result.status]}</p>
          {result.member_id !== null && (
            <p className="mt-1 text-neutral-500">
              {result.name} · +{result.points_awarded} pts (balance {result.points_balance}) · streak{' '}
              {result.current_streak}d
            </p>
          )}
        </div>
      )}
    </section>
  )
}
