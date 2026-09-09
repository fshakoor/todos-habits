import { useState } from 'react'
import type { Difficulty, Habit } from '../lib/api'
import { DIFFICULTIES } from '../lib/habitColor'
import { Modal, Segmented } from './Modal'
import { Trash } from './icons'

type Props = {
  habit: Habit
  onSave: (patch: Partial<Habit>) => void
  onDelete: () => void
  onClose: () => void
}

export function HabitEditor({ habit, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(habit.name)
  const [difficulty, setDifficulty] = useState<Difficulty>(habit.difficulty)
  const [up, setUp] = useState(!!habit.up)
  const [down, setDown] = useState(!!habit.down)

  const save = () => {
    onSave({ name: name.trim() || habit.name, difficulty, up: up ? 1 : 0, down: down ? 1 : 0 })
    onClose()
  }

  return (
    <Modal title="Edit habit" onClose={save}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        className="w-full bg-transparent text-[16px] outline-none"
        placeholder="Habit name"
      />

      <div className="mt-4">
        <div className="mb-1.5 text-xs text-faint">Difficulty</div>
        <Segmented options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-xs text-faint">Buttons</div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setUp((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 text-xs ${up ? 'border-line-strong bg-surface2 text-emerald-400' : 'border-line text-dim'}`}
          >
            Positive
          </button>
          <button
            onClick={() => setDown((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 text-xs ${down ? 'border-line-strong bg-surface2 text-red-400' : 'border-line text-dim'}`}
          >
            Negative
          </button>
        </div>
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
