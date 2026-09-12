import { useEffect } from 'react'
import { BadgeIconCircle } from './BadgeIconCircle'

export interface BadgeModalData {
  name: string
  earned: boolean
  description: string
  caption?: string
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
        className="flex w-full max-w-xs flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-900 px-6 pb-6 pt-10 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <BadgeIconCircle name={badge.name} earned={badge.earned} size={140} ringWidth={5} className="animate-dock-bounce" />

        <p className={`mt-5 text-lg font-semibold ${badge.earned ? 'text-amber-400' : 'text-neutral-300'}`}>
          {badge.name}
        </p>
        <p className="mt-2 text-sm leading-snug text-neutral-400">{badge.description}</p>
        {badge.caption && (
          <p className="mt-3 text-xs text-neutral-600">{badge.earned ? `Earned ${badge.caption}` : badge.caption}</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-lg bg-neutral-800 px-4 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}
