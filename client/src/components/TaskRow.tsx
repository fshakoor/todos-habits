import { clsx } from 'clsx'
import type { Project, Task } from '../lib/api'
import { dueLabel, isOverdue, today } from '../lib/date'
import { priorityColor } from '../lib/priority'
import { Check } from './icons'

type Props = {
  task: Task
  project?: Project
  onToggle: (done: boolean) => void
  onOpen: () => void
}

export function TaskRow({ task, project, onToggle, onOpen }: Props) {
  const done = !!task.done
  const ring = priorityColor(task.priority) || 'var(--color-line-strong)'
  const overdue = task.due_date ? isOverdue(task.due_date) : false
  const isToday = task.due_date === today()

  return (
    <div className="group flex items-start gap-3 py-2.5">
      <button
        onClick={() => onToggle(!done)}
        aria-label={done ? 'mark not done' : 'mark done'}
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{
          borderColor: done ? 'var(--color-faint)' : ring,
          background: done ? 'var(--color-faint)' : 'transparent',
        }}
      >
        <Check width={12} height={12} className={clsx('transition-opacity', done ? 'opacity-100' : 'opacity-0')} style={{ color: 'var(--color-bg)' }} />
      </button>

      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className={clsx('truncate text-[15px] leading-snug', done ? 'text-faint line-through' : 'text-ink')}>
          {task.title}
        </div>
        {(task.due_date || project || task.note) && (
          <div className="mt-0.5 flex items-center gap-2.5 text-xs">
            {task.due_date && (
              <span className={clsx(overdue && !done ? 'text-red-400' : isToday && !done ? 'text-accent' : 'text-dim')}>
                {dueLabel(task.due_date)}
              </span>
            )}
            {task.note && <span className="text-faint">note</span>}
            {project && (
              <span className="inline-flex items-center gap-1 text-dim">
                <span className="size-1.5 rounded-full" style={{ background: dotColor(project.color) }} />
                {project.name}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  )
}

const DOT: Record<string, string> = {
  gray: '#8b8b93',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
}
export function dotColor(c: string): string {
  return DOT[c] || DOT.gray
}
