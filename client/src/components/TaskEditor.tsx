import { useState } from 'react'
import { clsx } from 'clsx'
import type { Project, Task, TaskPatch } from '../lib/api'
import { PRIORITIES } from '../lib/priority'
import { Trash } from './icons'
import { Modal } from './Modal'
import { dotColor } from './TaskRow'

type Props = {
  task: Task
  projects: Project[]
  onSave: (patch: TaskPatch) => void
  onDelete: () => void
  onClose: () => void
}

export function TaskEditor({ task, projects, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note ?? '')
  const [due, setDue] = useState(task.due_date ?? '')
  const [priority, setPriority] = useState(task.priority)
  const [projectId, setProjectId] = useState<number | null>(task.project_id)

  const save = () => {
    onSave({
      title: title.trim() || task.title,
      note: note.trim() || null,
      due_date: due || null,
      priority,
      project_id: projectId,
    })
    onClose()
  }

  return (
    <Modal title="Edit task" onClose={save}>
      <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="w-full bg-transparent text-[16px] text-ink outline-none"
          placeholder="Task name"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-none bg-transparent text-sm text-dim outline-none placeholder:text-faint"
          placeholder="Note"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border border-line bg-surface2 px-2.5 py-1.5 text-sm text-ink"
          />
          {due && (
            <button onClick={() => setDue('')} className="text-xs text-faint hover:text-dim">
              clear date
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={clsx(
                'rounded-lg border px-2.5 py-1 text-xs',
                priority === p.value ? 'border-line-strong bg-surface2 text-ink' : 'border-line text-dim',
              )}
              style={priority === p.value && p.color ? { color: p.color } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setProjectId(null)}
            className={clsx(
              'rounded-lg border px-2.5 py-1 text-xs',
              projectId === null ? 'border-line-strong bg-surface2 text-ink' : 'border-line text-dim',
            )}
          >
            Inbox
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjectId(p.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs',
                projectId === p.id ? 'border-line-strong bg-surface2 text-ink' : 'border-line text-dim',
              )}
            >
              <span className="size-1.5 rounded-full" style={{ background: dotColor(p.color) }} />
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-line pt-3">
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
