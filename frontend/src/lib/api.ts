const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface TapResult {
  status: 'recorded' | 'duplicate' | 'unknown_tag'
  member_id: number | null
  points_awarded: number
  points_balance: number | null
  current_streak: number | null
  longest_streak: number | null
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}
