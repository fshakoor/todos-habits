import { clsx } from 'clsx'
import type { Daily } from '../lib/api'
import { Check, Flame } from './icons'

type Props = {
  daily: Daily
  onCheck: (done: boolean) => void
  onOpen: () => void
}

export function DailyRow({ daily, onCheck, onOpen }: Props) {
  const done = daily.done_today
  const dueToday = daily.due_today

  return (
    <div className="card flex items-start gap-3 p-3">
      <button
        onClick={() => onCheck(!done)}
        disabled={!dueToday && !done}
        aria-label={done ? 'undo' : 'complete'}
        className={clsx(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors',
          done ? 'border-accent bg-accent text-black' : 'border-line-strong text-transparent',
          !dueToday && !done && 'opacity-40',
        )}
      >
        <Check width={14} height={14} className={done ? 'opacity-100' : 'opacity-0'} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onOpen} className="min-w-0 text-left">
            <span className={clsx('text-[15px]', done ? 'text-faint line-through' : dueToday ? 'text-ink' : 'text-dim')}>
              {daily.name}
            </span>
          </button>
          {daily.streak > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-orange-400">
              <Flame width={13} height={13} />
              <span className="num">{daily.streak}</span>
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {daily.history.map((cell) => (
            <span
              key={cell.date}
              title={cell.date}
              className="size-2.5 rounded-[3px]"
              style={{
                background: cell.done
                  ? 'var(--color-accent)'
                  : cell.due
                    ? 'var(--color-surface3)'
                    : 'transparent',
                border: cell.due && !cell.done ? '1px solid var(--color-line)' : 'none',
                opacity: cell.due || cell.done ? 1 : 0.25,
              }}
            >
              {!cell.due && !cell.done ? (
                <span className="block size-full scale-[0.35] rounded-full bg-faint" />
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
