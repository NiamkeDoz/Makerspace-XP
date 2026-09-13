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
