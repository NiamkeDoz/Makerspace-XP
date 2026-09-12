import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

// --- Attendance badges (Maker theme) ---

export const SparkleIcon = (p: IconProps) =>
  base(<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />, p)

export const PlugIcon = (p: IconProps) =>
  base(
    <>
      <path d="M9 2v5M15 2v5M7 7h10v3a5 5 0 0 1-10 0V7z" />
      <path d="M12 15v3M8.5 21h7" />
    </>,
    p,
  )

export const WrenchIcon = (p: IconProps) =>
  base(
    <path d="M14.5 6.5a4 4 0 0 0-5.4 4.9L3 17.5 6.5 21l6.1-6.1a4 4 0 0 0 4.9-5.4l-2.6 2.6-2.1-.5-.5-2.1 2.6-2.6z" />,
    p,
  )

export const ToolboxIcon = (p: IconProps) =>
  base(
    <>
      <rect x="2.5" y="9" width="19" height="11" rx="1.5" />
      <path d="M8.5 9V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v3" />
      <path d="M2.5 13.5h19M11 13.5v3" />
    </>,
    p,
  )

export const CogIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>,
    p,
  )

export const GearDotIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.3 7.3l1.4 1.4M15.3 15.3l1.4 1.4M7.3 16.7l1.4-1.4M15.3 8.7l1.4-1.4" />
    </>,
    p,
  )

export const HammerIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 21l6.5-6.5" />
      <path d="M12.5 6.5l5-3 3 3-3 5-2-1-4.5 4.5-2-2 4.5-4.5-1-2z" />
    </>,
    p,
  )

export const ClipboardCheckIcon = (p: IconProps) =>
  base(
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 13l2 2 4-4.5" />
    </>,
    p,
  )

export const TargetIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>,
    p,
  )

export const AnvilIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 10h6l2-2h6l2 2v2H3z" />
      <path d="M9 14h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2z" />
      <path d="M12 17v3M9 20h6" />
    </>,
    p,
  )

export const CompassIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-6 2 2-6 6-2z" />
    </>,
    p,
  )

export const StarIcon = (p: IconProps) =>
  base(<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3l-5.8 3.2 1.1-6.5-4.8-4.6 6.6-.9L12 2.5z" />, p)

// --- Streak badges (Modern/Minimal theme) ---

export const ArrowUpRightIcon = (p: IconProps) => base(<path d="M7 17L17 7M9 7h8v8" />, p)

export const CalendarCheckIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      <path d="M9 14l2 2 4-4.5" />
    </>,
    p,
  )

export const ShieldIcon = (p: IconProps) => base(<path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />, p)

export const LinkIcon = (p: IconProps) =>
  base(
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M8 16.5l-1.5 1.5a3.2 3.2 0 0 1-4.5-4.5L5.5 10a3.2 3.2 0 0 1 4.5 0" />
      <path d="M16 7.5l1.5-1.5a3.2 3.2 0 0 1 4.5 4.5L18.5 14a3.2 3.2 0 0 1-4.5 0" />
    </>,
    p,
  )

export const LockIcon = (p: IconProps) =>
  base(
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </>,
    p,
  )

export const ZapIcon = (p: IconProps) => base(<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />, p)

export const FlameIcon = (p: IconProps) =>
  base(
    <path d="M12 2s-1 3.5-4 6.5S5 14.5 5 17a7 7 0 0 0 14 0c0-3-2-5-2-5s.5 2-1 3c.3-2.5-1-4-2.5-6C13 7 12.5 4 12 2z" />,
    p,
  )

export const TrophyIcon = (p: IconProps) =>
  base(
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" />
      <path d="M12 14v3M9 21h6M10 17h4v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z" />
    </>,
    p,
  )

export const ATTENDANCE_BADGE_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  'First Spark': SparkleIcon,
  'Getting Wired': PlugIcon,
  Tinkerer: WrenchIcon,
  'Workbench Regular': ToolboxIcon,
  Fabricator: CogIcon,
  Machinist: GearDotIcon,
  'Master Craftsman': HammerIcon,
  'Shop Foreman': ClipboardCheckIcon,
  'Full Circle': TargetIcon,
  'Forge Legend': AnvilIcon,
  'Architect of the Space': CompassIcon,
  'Founding Spirit': StarIcon,
}

export const STREAK_BADGE_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  Momentum: ArrowUpRightIcon,
  Consistency: CalendarCheckIcon,
  Discipline: ShieldIcon,
  'Habit Formed': LinkIcon,
  'Locked In': LockIcon,
  Unstoppable: ZapIcon,
  Relentless: FlameIcon,
  'Year One': TrophyIcon,
}

export function badgeIcon(name: string) {
  return ATTENDANCE_BADGE_ICONS[name] ?? STREAK_BADGE_ICONS[name] ?? SparkleIcon
}
