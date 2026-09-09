import { useState } from 'react'
import type { Gained, Habit } from '../lib/api'
import { valueColor } from '../lib/habitColor'
import { Minus, Plus } from './icons'

type Float = { id: number; text: string; color: string }

type Props = {
  habit: Habit
  onTap: (dir: 1 | -1) => Promise<{ gained: Gained; leveledUp: boolean }>
  onOpen: () => void
}

export function HabitCard({ habit, onTap, onOpen }: Props) {
  const [floats, setFloats] = useState<Float[]>([])
  const color = valueColor(habit.value)

  const tap = async (dir: 1 | -1) => {
    const { gained } = await onTap(dir)
    const parts: string[] = []
    if (gained.xp) parts.push(`${gained.xp > 0 ? '+' : ''}${round(gained.xp)} xp`)
    if (gained.gold) parts.push(`${gained.gold > 0 ? '+' : ''}${round(gained.gold)} gp`)
    if (gained.hp) parts.push(`${round(gained.hp)} hp`)
    const text = parts.join('  ') || (dir === 1 ? '+1' : '-1')
    const id = Date.now() + Math.random()
    setFloats((f) => [...f, { id, text, color: gained.hp < 0 ? '#ef4444' : color }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900)
  }

  return (
    <div className="card relative flex items-stretch overflow-hidden">
      <span className="w-1 shrink-0" style={{ background: color }} />
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-2">
        {habit.down ? (
          <TapButton onClick={() => tap(-1)} tone="down">
            <Minus width={16} height={16} />
          </TapButton>
        ) : null}
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="truncate text-[15px]">{habit.name}</div>
          {(habit.up_today > 0 || habit.down_today > 0) && (
            <div className="mt-0.5 text-[11px] text-faint num">
              {habit.up_today > 0 && <span className="text-emerald-400">+{habit.up_today}</span>}
              {habit.up_today > 0 && habit.down_today > 0 && <span> </span>}
              {habit.down_today > 0 && <span className="text-red-400"> -{habit.down_today}</span>}
              <span> today</span>
            </div>
          )}
        </button>
        {habit.up ? (
          <TapButton onClick={() => tap(1)} tone="up">
            <Plus width={16} height={16} />
          </TapButton>
        ) : null}
      </div>
      {floats.map((f) => (
        <span key={f.id} className="floatfx num absolute right-3 top-2 text-xs font-semibold" style={{ color: f.color }}>
          {f.text}
        </span>
      ))}
    </div>
  )
}

function TapButton({ onClick, tone, children }: { onClick: () => void; tone: 'up' | 'down'; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => {
        e.currentTarget.classList.remove('pop')
        void e.currentTarget.offsetWidth
        e.currentTarget.classList.add('pop')
        onClick()
      }}
      className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface2 text-dim hover:text-ink"
      style={tone === 'up' ? { color: '#34d399' } : { color: '#f87171' }}
      aria-label={tone === 'up' ? 'good' : 'bad'}
    >
      {children}
    </button>
  )
}

function round(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}
