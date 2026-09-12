export type BadgeCategory = 'attendance' | 'streak' | 'weekly_streak'

export function badgeDescription(category: BadgeCategory, threshold: number): string {
  if (category === 'attendance') {
    return `Check in at the space ${threshold} time${threshold === 1 ? '' : 's'}.`
  }
  if (category === 'streak') {
    return `Keep a ${threshold}-day tap-in streak going.`
  }
  const months = threshold / 4
  return `Check in at least once a week for ${months} month${months === 1 ? '' : 's'} in a row.`
}
