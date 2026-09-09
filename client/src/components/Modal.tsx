import type { ReactNode } from 'react'
import { X } from './icons'

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg rounded-b-none p-4 sm:rounded-2xl"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">{title}</span>
          <button onClick={onClose} className="rounded-md p-1 text-dim hover:text-ink" aria-label="close">
            <X width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-lg border px-2.5 py-1 text-xs ${
            value === o.key ? 'border-line-strong bg-surface2 text-ink' : 'border-line text-dim'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
