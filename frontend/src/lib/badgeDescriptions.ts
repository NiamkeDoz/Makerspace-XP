export type BadgeCategory = 'attendance' | 'streak' | 'weekly_streak' | `station_${string}`

export const STATION_LABELS: Record<string, string> = {
  laser_cutter: 'Laser Cutter',
  '3d_printing': '3D Printing',
  cricut: 'Cricut Cutter',
  resin: 'Resin',
  crochet: 'Crochet',
  woodshop: 'Woodshop',
}

export function badgeDescription(category: string, threshold: number): string {
  if (category === 'attendance') {
    return `Check in at the space ${threshold} time${threshold === 1 ? '' : 's'}.`
  }
  if (category === 'streak') {
    return `Keep a ${threshold}-day tap-in streak going.`
  }
  if (category === 'weekly_streak') {
    const months = threshold / 4
    return `Check in at least once a week for ${months} month${months === 1 ? '' : 's'} in a row.`
  }
  if (category.startsWith('station_')) {
    const station = category.slice('station_'.length)
    const label = STATION_LABELS[station] ?? station
    return `Use the ${label} ${threshold} time${threshold === 1 ? '' : 's'}.`
  }
  return ''
}

const CATEGORY_LABELS: Record<string, string> = {
  attendance: 'Attendance',
  streak: 'Streak',
  weekly_streak: 'Weekly Streak',
}

export function categoryLabel(category: string): string {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category]
  if (category.startsWith('station_')) return STATION_LABELS[category.slice('station_'.length)] ?? category
  return category
}

// Mirrors the backend's ALL_BADGE_CATALOGS keys exactly — used to populate the "which
// catalog does this custom badge join" dropdown on the admin custom-badges page.
export const ALL_BADGE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'streak', label: 'Streak' },
  { value: 'weekly_streak', label: 'Weekly Streak' },
  ...Object.entries(STATION_LABELS).map(([key, label]) => ({ value: `station_${key}`, label })),
]
