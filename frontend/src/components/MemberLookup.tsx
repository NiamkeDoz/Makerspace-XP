import { useState, type FormEvent } from 'react'
import { fetchMember, type Member } from '../lib/api'

export function MemberLookup() {
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

  return (
    <section className="w-full max-w-lg">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Member Lookup</h2>

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
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-neutral-400">Name</dt>
          <dd>{member.name}</dd>
          <dt className="text-neutral-400">Points</dt>
          <dd>{member.points_balance}</dd>
          <dt className="text-neutral-400">Current streak</dt>
          <dd>{member.current_streak}d</dd>
          <dt className="text-neutral-400">Longest streak</dt>
          <dd>{member.longest_streak}d</dd>
          <dt className="text-neutral-400">Total visits</dt>
          <dd>{member.total_visits}</dd>
          <dt className="text-neutral-400">Last tap</dt>
          <dd>{member.last_tap_date ?? '—'}</dd>
          <dt className="text-neutral-400">Member since</dt>
          <dd>{new Date(member.member_since).toLocaleDateString()}</dd>
        </dl>
      )}
    </section>
  )
}
