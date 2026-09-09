import { useState } from 'react'

type View = 'tasks' | 'habits'

export function App() {
  const [view, setView] = useState<View>('tasks')

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4">
      <header className="flex items-center justify-between py-4">
        <div className="inline-flex rounded-full border border-line bg-surface p-1 text-sm">
          <button
            onClick={() => setView('tasks')}
            className={`rounded-full px-4 py-1.5 ${view === 'tasks' ? 'bg-surface3 text-ink' : 'text-dim'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setView('habits')}
            className={`rounded-full px-4 py-1.5 ${view === 'habits' ? 'bg-surface3 text-ink' : 'text-dim'}`}
          >
            Habits
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 pb-10">
        {view === 'tasks' ? (
          <div className="text-dim">Tasks go here.</div>
        ) : (
          <div className="text-dim">Habits go here.</div>
        )}
      </main>
    </div>
  )
}
