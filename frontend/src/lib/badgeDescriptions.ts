export type BadgeCategory = 'attendance' | 'streak'

export function badgeDescription(category: BadgeCategory, threshold: number): string {
  if (category === 'attendance') {
    return `Check in at the space ${threshold} time${threshold === 1 ? '' : 's'}.`
  }
  return `Keep a ${threshold}-day tap-in streak going.`
}
