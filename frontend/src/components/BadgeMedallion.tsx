import { BadgeIconCircle } from './BadgeIconCircle'

interface BadgeMedallionProps {
  name: string
  earned: boolean
  caption?: string
  size?: number
  onClick: () => void
}

export function BadgeMedallion({ name, earned, caption, size = 64, onClick }: BadgeMedallionProps) {
  return (
    <button type="button" onClick={onClick} className="flex w-20 flex-col items-center gap-1.5">
      <BadgeIconCircle name={name} earned={earned} size={size} className="transition-transform active:scale-95" />
      <p
        className="text-center text-[11px] leading-tight"
        style={{ color: earned ? 'var(--text-muted)' : 'var(--text-faint)' }}
      >
        {name}
      </p>
      {caption && <p className="text-center text-[10px] leading-tight text-[var(--text-faint)]">{caption}</p>}
    </button>
  )
}
