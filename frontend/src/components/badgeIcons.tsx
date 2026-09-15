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

// --- Extra icons, for custom badges (not tied to any built-in badge name) ---

export const HeartIcon = (p: IconProps) =>
  base(<path d="M12 20.5S3.5 15 3.5 9a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2c0 6-8.5 11.5-8.5 11.5z" />, p)

export const GiftIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3.5" y="9" width="17" height="12" rx="1.2" />
      <path d="M3.5 13h17M12 9v12" />
      <path d="M12 9C9 9 8 7 8 5.5A2.5 2.5 0 0 1 12 4a2.5 2.5 0 0 1 4 1.5C16 7 15 9 12 9z" />
    </>,
    p,
  )

export const MedalIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="M9.5 10L7 3h3l2 5M14.5 10L17 3h-3l-2 5" />
      <path d="M12 12.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="currentColor" stroke="none" />
    </>,
    p,
  )

export const RocketIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 2.5c3 1 5 4.5 5 8.5 0 2-1 4-2 5.5l-3 2-3-2c-1-1.5-2-3.5-2-5.5 0-4 2-7.5 5-8.5z" />
      <circle cx="12" cy="10.5" r="1.7" />
      <path d="M9 15.5l-2.5 1.5 1-3M15 15.5l2.5 1.5-1-3M10 19.5l2 2 2-2" />
    </>,
    p,
  )

export const BookIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 4.5C6 3.5 9 3.5 12 4.5v15c-3-1-6-1-8 0V4.5z" />
      <path d="M20 4.5c-2-1-5-1-8 0v15c3-1 6-1 8 0V4.5z" />
    </>,
    p,
  )

export const PaintbrushIcon = (p: IconProps) =>
  base(
    <>
      <path d="M17.5 2.5c1.5 0 2.5 1 2.5 2.5 0 2-2 3-4 4.5l-3 3-3-3 3-3c1.5-2 2.5-4 4.5-4z" />
      <path d="M13 9.5L5 17.5c-1 1-1 2.5 0 3.5s2.5 1 3.5 0L16.5 13" />
    </>,
    p,
  )

export const LeafIcon = (p: IconProps) =>
  base(
    <>
      <path d="M20 4C10 4 4 10 4 18v2h2c8 0 14-6 14-16V4z" />
      <path d="M6 20C10 15 14 11 20 6" />
    </>,
    p,
  )

export const CrownIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8z" />
      <path d="M6.5 21.5h11" />
    </>,
    p,
  )

export const DiamondIcon = (p: IconProps) => base(<path d="M6 3h12l4 6-10 12L2 9z" />, p)

export const PuzzleIcon = (p: IconProps) =>
  base(
    <path d="M9 3.5h3v2a1.8 1.8 0 0 0 3.5 0v-2h3v3h-2a1.8 1.8 0 0 0 0 3.5h2v3h-3a1.8 1.8 0 0 0-3.5 0v3h-3v-3H6a1.8 1.8 0 0 0 0-3.5H4v-3h3a1.8 1.8 0 0 0 0-3.5H4v-3h5v2z" />,
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

// --- Weekly streak (monthly milestone) badges: a numbered calendar, one per month 1-12 ---

function monthIcon(month: number) {
  return (p: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      <text x="12" y="17.5" textAnchor="middle" fontSize="9" fontWeight="700" stroke="none" fill="currentColor">
        {month}
      </text>
    </svg>
  )
}

export const WEEKLY_STREAK_BADGE_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  '1-Month Streak': monthIcon(1),
  '2-Month Streak': monthIcon(2),
  'Quarter Streak': monthIcon(3),
  '4-Month Streak': monthIcon(4),
  '5-Month Streak': monthIcon(5),
  'Half-Year Streak': monthIcon(6),
  '7-Month Streak': monthIcon(7),
  '8-Month Streak': monthIcon(8),
  'Three-Quarter Streak': monthIcon(9),
  '10-Month Streak': monthIcon(10),
  '11-Month Streak': monthIcon(11),
  'Year-Long Streak': monthIcon(12),
}

// --- Named icon registry: a flat key -> component map, independent of any badge
// name. Used by custom badges, where an admin picks an icon explicitly rather
// than it being inferred from the badge's name. ---

export const ICON_REGISTRY: Record<string, (p: IconProps) => React.ReactElement> = {
  sparkle: SparkleIcon,
  plug: PlugIcon,
  wrench: WrenchIcon,
  toolbox: ToolboxIcon,
  cog: CogIcon,
  'gear-dot': GearDotIcon,
  hammer: HammerIcon,
  'clipboard-check': ClipboardCheckIcon,
  target: TargetIcon,
  anvil: AnvilIcon,
  compass: CompassIcon,
  star: StarIcon,
  'arrow-up-right': ArrowUpRightIcon,
  'calendar-check': CalendarCheckIcon,
  shield: ShieldIcon,
  link: LinkIcon,
  lock: LockIcon,
  zap: ZapIcon,
  flame: FlameIcon,
  trophy: TrophyIcon,
  heart: HeartIcon,
  gift: GiftIcon,
  medal: MedalIcon,
  rocket: RocketIcon,
  book: BookIcon,
  paintbrush: PaintbrushIcon,
  leaf: LeafIcon,
  crown: CrownIcon,
  diamond: DiamondIcon,
  puzzle: PuzzleIcon,
}

export const ICON_KEYS = Object.keys(ICON_REGISTRY)

export function badgeIcon(name: string, iconKey?: string | null) {
  if (iconKey && ICON_REGISTRY[iconKey]) return ICON_REGISTRY[iconKey]
  return ATTENDANCE_BADGE_ICONS[name] ?? STREAK_BADGE_ICONS[name] ?? WEEKLY_STREAK_BADGE_ICONS[name] ?? SparkleIcon
}
