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

  const [enrollTagId, setEnrollTagId] = useState('')
  const [enrollName, setEnrollName] = useState('')

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
      await adminEnrollMember(token, enrollTagId, enrollName)
      setEnrollTagId('')
      setEnrollName('')
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
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950"
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
        <button onClick={handleLogout} className="text-sm text-neutral-400 hover:text-neutral-200">
          Lock
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleEnroll} className="mb-6 flex flex-wrap gap-2">
        <input
          value={enrollTagId}
          onChange={(e) => setEnrollTagId(e.target.value)}
          placeholder="Tag ID"
          required
          className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <input
          value={enrollName}
          onChange={(e) => setEnrollName(e.target.value)}
          placeholder="Name"
          required
          className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950"
        >
          Enroll
        </button>
      </form>

      {members === null && <p className="text-sm text-neutral-400">Loading…</p>}
      {members && members.length === 0 && <p className="text-sm text-neutral-400">No members yet.</p>}

      {members && members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
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
                  <tr key={member.id} className="border-b border-neutral-900">
                    <td className="py-2 pr-2">{member.name}</td>
                    <td className="py-2 pr-2 text-neutral-500">{member.tag_id}</td>
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
                        className="w-20 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-neutral-500"
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
                        className="w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-neutral-500"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleAdjust(member)}
                        className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium hover:bg-neutral-700"
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
