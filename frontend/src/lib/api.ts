const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface TapResult {
  status: 'recorded' | 'duplicate' | 'unknown_tag' | 'enrolled'
  member_id: number | null
  name: string | null
  points_awarded: number
  points_balance: number | null
  current_streak: number | null
  longest_streak: number | null
}

export async function submitTap(tagId: string, readerId: string, name?: string): Promise<TapResult> {
  const res = await fetch(`${API_BASE_URL}/taps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_id: tagId, reader_id: readerId, name: name || undefined }),
  })
  if (!res.ok) throw new ApiError('Tap failed', res.status)
  return res.json()
}

export interface Member {
  id: number
  name: string
  points_balance: number
  current_streak: number
  longest_streak: number
  last_tap_date: string | null
  total_visits: number
  member_since: string
}

export interface LeaderboardEntry {
  rank: number
  member_id: number
  name: string
  points_balance: number
  current_streak: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}

export async function fetchLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`)
  if (!res.ok) throw new ApiError('Failed to load leaderboard', res.status)
  return res.json()
}

export async function fetchMember(id: number): Promise<Member> {
  const res = await fetch(`${API_BASE_URL}/members/${id}`)
  if (!res.ok) throw new ApiError(res.status === 404 ? 'Member not found' : 'Failed to load member', res.status)
  return res.json()
}

export interface AdminMember {
  id: number
  tag_id: string
  name: string
  points_balance: number
  current_streak: number
  longest_streak: number
  last_tap_date: string | null
  created_at: string
}

function adminHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Admin-Token': token }
}

async function parseAdminResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new ApiError('Invalid admin token', 401)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? 'Request failed', res.status)
  }
  return res.json()
}

export async function adminListMembers(token: string): Promise<AdminMember[]> {
  const res = await fetch(`${API_BASE_URL}/admin/members`, { headers: adminHeaders(token) })
  return parseAdminResponse(res)
}

export async function adminEnrollMember(token: string, tagId: string, name: string): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({ tag_id: tagId, name }),
  })
  return parseAdminResponse(res)
}

export async function adminAdjustMember(
  token: string,
  id: number,
  changes: { points_balance?: number; current_streak?: number },
): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(changes),
  })
  return parseAdminResponse(res)
}
