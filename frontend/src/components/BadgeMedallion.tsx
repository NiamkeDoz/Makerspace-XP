import { badgeIcon } from './badgeIcons'

const GOLD_RING = 'conic-gradient(from 180deg, #92650f, #f6e2a0, #d8a534, #f6e2a0, #92650f)'
const LOCKED_RING = 'conic-gradient(from 180deg, #3f3f46, #6b6b73, #52525b, #6b6b73, #3f3f46)'

interface BadgeMedallionProps {
  name: string
  earned: boolean
  caption?: string
  size?: number
}

export function BadgeMedallion({ name, earned, caption, size = 64 }: BadgeMedallionProps) {
  const Icon = badgeIcon(name)

  return (
    <div className="flex w-20 flex-col items-center gap-1.5" title={name}>
      <div
        className="flex items-center justify-center rounded-full p-[3px] shadow-lg"
        style={{ width: size, height: size, background: earned ? GOLD_RING : LOCKED_RING }}
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
            className="h-7 w-7"
            style={{ color: earned ? '#f2cf72' : '#71717a' }}
            strokeWidth={earned ? 1.8 : 1.6}
          />
        </div>
      </div>
      <p className={`text-center text-[11px] leading-tight ${earned ? 'text-neutral-300' : 'text-neutral-600'}`}>
        {name}
      </p>
      {caption && <p className="text-center text-[10px] leading-tight text-neutral-600">{caption}</p>}
    </div>
  )
}
