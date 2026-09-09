import { useState } from 'react'
import type { Daily, Habit } from '../lib/api'
import { useHabits } from '../lib/useHabits'
import { CharacterBar } from '../components/CharacterBar'
import { HabitCard } from '../components/HabitCard'
import { DailyRow } from '../components/DailyRow'
import { HabitEditor } from '../components/HabitEditor'
import { DailyEditor } from '../components/DailyEditor'
import { Plus } from '../components/icons'

export function HabitsView() {
  const h = useHabits()
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [editDaily, setEditDaily] = useState<Daily | null>(null)
  const [levelUp, setLevelUp] = useState(0)

  const afterAction = (res: { leveledUp: boolean }) => {
    if (res.leveledUp) {
      setLevelUp((n) => n + 1)
      setTimeout(() => setLevelUp((n) => Math.max(0, n - 1)), 1600)
    }
  }

  if (h.loading || !h.stats) return <div className="py-10 text-center text-sm text-faint">Loading</div>

  return (
    <div className="h-full overflow-y-auto pb-10">
      <CharacterBar stats={h.stats} />

      <Section
        title="Habits"
        placeholder="Add a habit"
        onAdd={(name) => h.addHabit(name, 'easy')}
        empty={h.habits.length === 0}
        emptyLabel="No habits yet. Add one you want to do more, or less, of."
      >
        {h.habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onTap={async (dir) => {
              const res = await h.tap(habit.id, dir)
              afterAction(res)
              return res
            }}
            onOpen={() => setEditHabit(habit)}
          />
        ))}
      </Section>

      <Section
        title="Dailies"
        placeholder="Add a daily"
        onAdd={(name) => h.addDaily(name, 'easy', [0, 1, 2, 3, 4, 5, 6])}
        empty={h.dailies.length === 0}
        emptyLabel="No dailies yet. These reset every day and keep a streak."
      >
        {h.dailies.map((daily) => (
          <DailyRow
            key={daily.id}
            daily={daily}
            onCheck={async (done) => afterAction(await h.check(daily.id, done))}
            onOpen={() => setEditDaily(daily)}
          />
        ))}
      </Section>

      {editHabit && (
        <HabitEditor
          habit={editHabit}
          onSave={(patch) => h.patchHabit(editHabit.id, patch)}
          onDelete={() => h.removeHabit(editHabit.id)}
          onClose={() => setEditHabit(null)}
        />
      )}
      {editDaily && (
        <DailyEditor
          daily={editDaily}
          onSave={(patch) => h.patchDaily(editDaily.id, patch)}
          onDelete={() => h.removeDaily(editDaily.id)}
          onClose={() => setEditDaily(null)}
        />
      )}

      {levelUp > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center">
          <div className="pop rounded-full border border-line-strong bg-surface px-5 py-2 text-sm font-semibold text-accent shadow-lg">
            Level up
          </div>
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  placeholder,
  onAdd,
  empty,
  emptyLabel,
  children,
}: {
  title: string
  placeholder: string
  onAdd: (name: string) => void
  empty: boolean
  emptyLabel: string
  children: React.ReactNode
}) {
  const [draft, setDraft] = useState('')
  const submit = () => {
    const name = draft.trim()
    if (!name) return
    onAdd(name)
    setDraft('')
  }
  return (
    <section className="mt-5">
      <div className="eyebrow mb-2">{title}</div>
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
        <Plus width={17} height={17} className="text-faint" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
        />
      </div>
      <div className="space-y-2">{children}</div>
      {empty && <div className="py-6 text-center text-sm text-faint">{emptyLabel}</div>}
    </section>
  )
}
