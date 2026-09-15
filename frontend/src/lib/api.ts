const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface TapResult {
  status: 'recorded' | 'duplicate' | 'unknown_tag' | 'enrolled' | 'checked_out' | 'retired_tag'
  member_id: number | null
  name: string | null
  points_awarded: number
  points_balance: number | null
  current_streak: number | null
  longest_streak: number | null
}

export interface OccupancyEntry {
  member_id: number
  name: string
  check_in: string
  check_in_reader_id: string
}

export async function fetchOccupancy(): Promise<OccupancyEntry[]> {
  const res = await fetch(`${API_BASE_URL}/occupancy`)
  if (!res.ok) throw new ApiError('Failed to load occupancy', res.status)
  return res.json()
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

export interface Badge {
  threshold: number
  name: string
  earned_at: string
}

export interface NextBadge {
  threshold: number
  name: string
  remaining: number
  description: string | null
  icon: string | null
}

export interface Member {
  id: number
  name: string
  points_balance: number
  current_streak: number
  longest_streak: number
  current_weekly_streak: number
  longest_weekly_streak: number
  level: number
  xp: number
  xp_to_next: number | null
  xp_into_level: number
  xp_for_level: number | null
  lifetime_xp: number
  prestige_count: number
  last_tap_date: string | null
  total_visits: number
  member_since: string
  attendance_badges: Badge[]
  streak_badges: Badge[]
  weekly_streak_badges: Badge[]
  next_attendance_badge: NextBadge | null
  next_streak_badge: NextBadge | null
  next_weekly_streak_badge: NextBadge | null
}

export interface LeaderboardEntry {
  rank: number
  member_id: number
  name: string
  points_balance: number
  current_streak: number
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
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

export async function fetchMemberIdByTag(tagId: string): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/members/by-tag/${encodeURIComponent(tagId)}`)
  if (!res.ok) throw new ApiError(res.status === 404 ? 'No member with that tag ID' : 'Lookup failed', res.status)
  const body: { id: number } = await res.json()
  return body.id
}

export interface CatalogBadge {
  category: string
  threshold: number
  name: string
  earned: boolean
  earned_at: string | null
  remaining: number | null
  description: string | null
  icon: string | null
}

export async function fetchMemberBadges(id: number): Promise<CatalogBadge[]> {
  const res = await fetch(`${API_BASE_URL}/members/${id}/badges`)
  if (!res.ok) throw new ApiError(res.status === 404 ? 'Member not found' : 'Failed to load badges', res.status)
  return res.json()
}

export interface WheelPrize {
  label: string
  xp_amount: number
  weight: number
}

export interface WheelStatus {
  can_spin: boolean
  next_spin_date: string | null
  bonus_spins: number
  prizes: WheelPrize[]
  last_prize_label: string | null
}

export interface SpinResult {
  prize_label: string
  xp_awarded: number
  level: number
  xp: number
  lifetime_xp: number
  leveled_up: boolean
  used_bonus_spin: boolean
  bonus_spins: number
  next_spin_date: string
}

export async function fetchWheelStatus(id: number): Promise<WheelStatus> {
  const res = await fetch(`${API_BASE_URL}/members/${id}/wheel`)
  if (!res.ok) throw new ApiError(res.status === 404 ? 'Member not found' : 'Failed to load wheel status', res.status)
  return res.json()
}

export async function spinWheel(id: number): Promise<SpinResult> {
  const res = await fetch(`${API_BASE_URL}/members/${id}/wheel/spin`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? 'Spin failed', res.status)
  }
  return res.json()
}

export interface AdminMember {
  id: number
  tag_id: string
  name: string
  points_balance: number
  current_streak: number
  longest_streak: number
  current_weekly_streak: number
  longest_weekly_streak: number
  level: number
  xp: number
  lifetime_xp: number
  prestige_count: number
  bonus_spins: number
  last_tap_date: string | null
  discord_username: string | null
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

export async function adminGetMember(token: string, id: number): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${id}`, { headers: adminHeaders(token) })
  return parseAdminResponse(res)
}

export async function adminEnrollMember(
  token: string,
  member: { tagId: string; firstName: string; lastName: string; memberSince?: string },
): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({
      tag_id: member.tagId,
      first_name: member.firstName,
      last_name: member.lastName,
      member_since: member.memberSince || null,
    }),
  })
  return parseAdminResponse(res)
}

export interface AdminAdjustChanges {
  name?: string
  discord_username?: string
  points_balance?: number
  current_streak?: number
  longest_streak?: number
  current_weekly_streak?: number
  longest_weekly_streak?: number
  xp?: number
  level?: number
  lifetime_xp?: number
  prestige_count?: number
  bonus_spins?: number
  member_since?: string
}

export async function adminAdjustMember(token: string, id: number, changes: AdminAdjustChanges): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(changes),
  })
  return parseAdminResponse(res)
}

export async function adminReassignTag(token: string, id: number, newTagId: string): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${id}/tag`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify({ new_tag_id: newTagId }),
  })
  return parseAdminResponse(res)
}

export async function adminPrestigeMember(token: string, id: number): Promise<AdminMember> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${id}/prestige`, {
    method: 'POST',
    headers: adminHeaders(token),
  })
  return parseAdminResponse(res)
}

export interface AdminSettings {
  base_points: number
  backups_enabled: boolean
  double_xp_start: string | null
  double_xp_end: string | null
  double_xp_active: boolean
}

export async function adminGetSettings(token: string): Promise<AdminSettings> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers: adminHeaders(token) })
  return parseAdminResponse(res)
}

export interface AdminSettingsChanges {
  base_points?: number
  backups_enabled?: boolean
  // Include the key with null to clear the window; omit the key entirely to leave it alone.
  double_xp_start?: string | null
  double_xp_end?: string | null
}

export async function adminUpdateSettings(token: string, changes: AdminSettingsChanges): Promise<AdminSettings> {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(changes),
  })
  return parseAdminResponse(res)
}

export interface AdminCatalogBadge {
  id: number | null
  category: string
  threshold: number
  name: string
  earned: boolean
  earned_at: string | null
  remaining: number | null
  description: string | null
  icon: string | null
}

export async function adminGetMemberBadges(token: string, id: number): Promise<AdminCatalogBadge[]> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${id}/badges`, { headers: adminHeaders(token) })
  return parseAdminResponse(res)
}

export async function adminAwardBadge(
  token: string,
  memberId: number,
  category: string,
  threshold: number,
): Promise<AdminCatalogBadge> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${memberId}/badges`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({ category, threshold }),
  })
  return parseAdminResponse(res)
}

export async function adminRevokeBadge(token: string, memberId: number, badgeId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/members/${memberId}/badges/${badgeId}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (res.status === 401) throw new ApiError('Invalid admin token', 401)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? 'Request failed', res.status)
  }
}

export interface CustomBadge {
  id: number
  category: string
  threshold: number
  name: string
  description: string
  icon: string
  created_at: string
}

export async function adminListCustomBadges(token: string): Promise<CustomBadge[]> {
  const res = await fetch(`${API_BASE_URL}/admin/custom-badges`, { headers: adminHeaders(token) })
  return parseAdminResponse(res)
}

export async function adminCreateCustomBadge(
  token: string,
  badge: { category: string; threshold: number; name: string; description: string; icon: string },
): Promise<CustomBadge> {
  const res = await fetch(`${API_BASE_URL}/admin/custom-badges`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(badge),
  })
  return parseAdminResponse(res)
}

export async function adminDeleteCustomBadge(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/custom-badges/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (res.status === 401) throw new ApiError('Invalid admin token', 401)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? 'Request failed', res.status)
  }
}
