import { badgeIcon } from './badgeIcons'

const GOLD_RING = 'conic-gradient(from 180deg, #92650f, #f6e2a0, #d8a534, #f6e2a0, #92650f)'
const LOCKED_RING = 'conic-gradient(from 180deg, #3f3f46, #6b6b73, #52525b, #6b6b73, #3f3f46)'

interface BadgeIconCircleProps {
  name: string
  earned: boolean
  icon?: string | null
  size?: number
  ringWidth?: number
  className?: string
}

export function BadgeIconCircle({ name, earned, icon, size = 64, ringWidth = 3, className }: BadgeIconCircleProps) {
  const Icon = badgeIcon(name, icon)

  return (
    <div
      className={`flex items-center justify-center rounded-full shadow-lg ${className ?? ''}`}
      style={{ width: size, height: size, padding: ringWidth, background: earned ? GOLD_RING : LOCKED_RING }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-full"
        style={{
          background: earned
            ? 'radial-gradient(circle at 32% 28%, #1c1a12, #05050a 75%)'
            : 'radial-gradient(circle at 32% 28%, #1c1c1f, #0a0a0b 75%)',
        }}
      >
        <Icon
          className="h-[44%] w-[44%]"
          style={{ color: earned ? '#f2cf72' : '#71717a' }}
          strokeWidth={earned ? 1.8 : 1.6}
        />
      </div>
    </div>
  )
}
