import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  adminAdjustMember,
  adminEnrollMember,
  adminListMembers,
  type AdminMember,
} from '../lib/api'

const TOKEN_STORAGE_KEY = 'admin_token'

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [tokenInput, setTokenInput] = useState(token)
  const [members, setMembers] = useState<AdminMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollTagId, setEnrollTagId] = useState('')
  const [enrollFirstName, setEnrollFirstName] = useState('')
  const [enrollLastName, setEnrollLastName] = useState('')
  const [enrollMemberSince, setEnrollMemberSince] = useState('')

  const [edits, setEdits] = useState<Record<number, { points_balance: string; current_streak: string }>>({})

  function loadMembers(activeToken: string) {
    adminListMembers(activeToken)
      .then((result) => {
        setMembers(result)
        setError(null)
      })
      .catch((err) => {
        setMembers(null)
        if (err instanceof ApiError && err.status === 401) {
          setError('Invalid admin token.')
          setToken('')
          localStorage.removeItem(TOKEN_STORAGE_KEY)
        } else {
          setError('Could not load members.')
        }
      })
  }

  useEffect(() => {
    if (token) loadMembers(token)
  }, [token])

  function handleTokenSubmit(e: FormEvent) {
    e.preventDefault()
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenInput)
    setToken(tokenInput)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setTokenInput('')
    setMembers(null)
  }

  async function handleEnroll(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await adminEnrollMember(token, {
        tagId: enrollTagId,
        firstName: enrollFirstName,
        lastName: enrollLastName,
        memberSince: enrollMemberSince,
      })
      setEnrollTagId('')
      setEnrollFirstName('')
      setEnrollLastName('')
      setEnrollMemberSince('')
      setShowEnrollModal(false)
      loadMembers(token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enrollment failed.')
    }
  }

  function editFor(member: AdminMember) {
    return (
      edits[member.id] ?? {
        points_balance: String(member.points_balance),
        current_streak: String(member.current_streak),
      }
    )
  }

  async function handleAdjust(member: AdminMember) {
    const edit = editFor(member)
    setError(null)
    try {
      await adminAdjustMember(token, member.id, {
        points_balance: Number(edit.points_balance),
        current_streak: Number(edit.current_streak),
      })
      loadMembers(token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.')
    }
  }

  if (!token) {
    return (
      <section className="w-full max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Admin</h2>
        <form onSubmit={handleTokenSubmit} className="flex gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Admin token"
            className="w-full rounded border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)]"
          >
            Unlock
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </section>
    )
  }

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Admin</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowEnrollModal(true)}
            className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)]"
          >
            Add member
          </button>
          <button onClick={handleLogout} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            Lock
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {showEnrollModal && (
        <EnrollMemberModal
          firstName={enrollFirstName}
          lastName={enrollLastName}
          tagId={enrollTagId}
          memberSince={enrollMemberSince}
          onFirstNameChange={setEnrollFirstName}
          onLastNameChange={setEnrollLastName}
          onTagIdChange={setEnrollTagId}
          onMemberSinceChange={setEnrollMemberSince}
          onSubmit={handleEnroll}
          onClose={() => setShowEnrollModal(false)}
        />
      )}

      {members === null && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {members && members.length === 0 && <p className="text-sm text-[var(--text-muted)]">No members yet.</p>}

      {members && members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-medium">Name</th>
                <th className="py-2 pr-2 font-medium">Tag</th>
                <th className="py-2 pr-2 font-medium">Points</th>
                <th className="py-2 pr-2 font-medium">Streak</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const edit = editFor(member)
                return (
                  <tr key={member.id} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-2">{member.name}</td>
                    <td className="py-2 pr-2 text-[var(--text-faint)]">{member.tag_id}</td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={edit.points_balance}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [member.id]: { ...editFor(member), points_balance: e.target.value },
                          }))
                        }
                        className="w-20 rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={edit.current_streak}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [member.id]: { ...editFor(member), current_streak: e.target.value },
                          }))
                        }
                        className="w-16 rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleAdjust(member)}
                        className="rounded bg-[var(--surface-2)] px-2 py-1 text-xs font-medium hover:opacity-80"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function EnrollMemberModal({
  firstName,
  lastName,
  tagId,
  memberSince,
  onFirstNameChange,
  onLastNameChange,
  onTagIdChange,
  onMemberSinceChange,
  onSubmit,
  onClose,
}: {
  firstName: string
  lastName: string
  tagId: string
  memberSince: string
  onFirstNameChange: (v: string) => void
  onLastNameChange: (v: string) => void
  onTagIdChange: (v: string) => void
  onMemberSinceChange: (v: string) => void
  onSubmit: (e: FormEvent) => void
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
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border px-6 py-6 shadow-2xl"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <h3 className="mb-4 text-lg font-semibold tracking-tight">Add member</h3>

        <div className="flex flex-col gap-3">
          <input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="First name"
            required
            autoFocus
            className="rounded border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Last name"
            required
            className="rounded border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={tagId}
            onChange={(e) => onTagIdChange(e.target.value)}
            placeholder="Tag ID"
            required
            className="rounded border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <label className="flex flex-col gap-1 text-xs text-[var(--text-faint)]">
            Member since (defaults to today)
            <input
              type="date"
              value={memberSince}
              onChange={(e) => onMemberSinceChange(e.target.value)}
              className="rounded border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm font-medium hover:opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-text)]"
          >
            Add member
          </button>
        </div>
      </form>
    </div>
  )
}
