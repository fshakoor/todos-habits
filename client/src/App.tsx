import { useState } from 'react'
import { TasksView } from './views/TasksView'
import { HabitsView } from './views/HabitsView'
import { SettingsSheet } from './components/SettingsSheet'
import { Gear } from './components/icons'
import { loadTheme, saveTheme, type ThemeMode } from './lib/theme'

type View = 'tasks' | 'habits'

const loadView = (): View => (localStorage.getItem('th-view') === 'habits' ? 'habits' : 'tasks')

export function App() {
  const [view, setViewState] = useState<View>(loadView)
  const [theme, setThemeState] = useState<ThemeMode>(loadTheme)
  const [settings, setSettings] = useState(false)

  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem('th-view', v)
    } catch {
      // ignore unwritable storage
    }
  }

  const setTheme = (m: ThemeMode) => {
    setThemeState(m)
    saveTheme(m)
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
        <button onClick={() => setSettings(true)} className="rounded-full p-2 text-faint hover:text-ink" aria-label="settings">
          <Gear width={18} height={18} />
        </button>
      </header>

      <main className="min-h-0 flex-1">{view === 'tasks' ? <TasksView /> : <HabitsView />}</main>

      {settings && <SettingsSheet theme={theme} setTheme={setTheme} onClose={() => setSettings(false)} />}
    </div>
  )
}
