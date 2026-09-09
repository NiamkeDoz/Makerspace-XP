const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface TapResult {
  status: 'recorded' | 'duplicate' | 'unknown_tag'
  member_id: number | null
  points_awarded: number
  points_balance: number | null
  current_streak: number | null
  longest_streak: number | null
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
