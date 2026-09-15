import { useEffect } from 'react'
import { BadgeIconCircle } from './BadgeIconCircle'

export interface BadgeModalData {
  name: string
  earned: boolean
  icon?: string | null
  description: string
  caption?: string
  progress?: { current: number; threshold: number }
}

export function BadgeModal({ badge, onClose }: { badge: BadgeModalData; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex w-full max-w-xs flex-col items-center rounded-2xl border px-6 pb-6 pt-10 text-center shadow-2xl"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <BadgeIconCircle
          name={badge.name}
          earned={badge.earned}
          icon={badge.icon}
          size={140}
          ringWidth={5}
          className="animate-dock-bounce"
        />

        <p
          className="mt-5 text-lg font-semibold"
          style={{ color: badge.earned ? '#f2cf72' : 'var(--text-muted)' }}
        >
          {badge.name}
        </p>
        <p className="mt-2 text-sm leading-snug text-[var(--text-muted)]">{badge.description}</p>

        {!badge.earned && badge.progress && (
          <div className="mt-4 w-full">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-faint)]">
              <span>{badge.progress.current}</span>
              <span>{badge.progress.threshold}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{
                  width: `${Math.min((badge.progress.current / badge.progress.threshold) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {badge.caption && (
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            {badge.earned ? `Earned ${badge.caption}` : badge.caption}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-lg px-4 py-1.5 text-sm font-medium hover:opacity-80"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
