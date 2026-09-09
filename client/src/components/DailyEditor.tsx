import { useState } from 'react'
import { clsx } from 'clsx'
import type { Daily, Difficulty } from '../lib/api'
import { DIFFICULTIES, WEEKDAYS } from '../lib/habitColor'
import { Modal, Segmented } from './Modal'
import { Trash } from './icons'

type Props = {
  daily: Daily
  onSave: (patch: Partial<Daily>) => void
  onDelete: () => void
  onClose: () => void
}

export function DailyEditor({ daily, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(daily.name)
  const [difficulty, setDifficulty] = useState<Difficulty>(daily.difficulty)
  const [days, setDays] = useState<number[]>(daily.days)

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))

  const save = () => {
    onSave({ name: name.trim() || daily.name, difficulty, days: days.length ? days : [0, 1, 2, 3, 4, 5, 6] })
    onClose()
  }

  return (
    <Modal title="Edit daily" onClose={save}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        className="w-full bg-transparent text-[16px] outline-none"
        placeholder="Daily name"
      />

      <div className="mt-4">
        <div className="mb-1.5 text-xs text-faint">Repeats on</div>
        <div className="flex gap-1.5">
          {WEEKDAYS.map((label, d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={clsx(
                'grid size-8 place-items-center rounded-full border text-xs',
                days.includes(d) ? 'border-line-strong bg-accent-soft text-accent' : 'border-line text-dim',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-xs text-faint">Difficulty</div>
        <Segmented options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
      </div>

      <div className="mt-5 flex justify-between border-t border-line pt-3">
        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-red-400"
        >
          <Trash width={15} height={15} /> Delete
        </button>
        <button onClick={save} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-black">
          Save
        </button>
      </div>
    </Modal>
  )
}
