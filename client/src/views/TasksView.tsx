import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import type { Project, Task } from '../lib/api'
import { dueLabel, today } from '../lib/date'
import { parseQuickAdd } from '../lib/parse'
import { useTasks } from '../lib/useTasks'
import { Plus } from '../components/icons'
import { TaskRow, dotColor } from '../components/TaskRow'
import { TaskEditor } from '../components/TaskEditor'

type Filter = 'today' | 'upcoming' | 'all' | 'inbox' | number // number = project id

export function TasksView() {
  const { tasks, projects, loading, addTask, patchTask, removeTask, clearDone, addProject, removeProject } = useTasks()
  const [filter, setFilter] = useState<Filter>('today')
  const [editing, setEditing] = useState<Task | null>(null)
  const [draft, setDraft] = useState('')

  const t = today()

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const open = tasks.filter((x) => !x.done)
  const submit = async () => {
    const text = draft.trim()
    if (!text) return
    const parsed = parseQuickAdd(text, t)
    setDraft('')
    const base: { due_date: string | null; project_id: number | null } = { due_date: parsed.due_date, project_id: null }
    if (filter === 'today' && !parsed.due_date) base.due_date = t
    if (typeof filter === 'number') base.project_id = filter
    await addTask({ title: parsed.title, priority: parsed.priority, due_date: base.due_date, project_id: base.project_id })
  }

  const preview = draft.trim() ? parseQuickAdd(draft, t) : null

  return (
    <div className="flex h-full flex-col">
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        projects={projects}
        counts={{
          today: open.filter((x) => x.due_date && x.due_date <= t).length,
          upcoming: open.filter((x) => x.due_date && x.due_date >= t).length,
          inbox: open.filter((x) => x.project_id === null).length,
          all: open.length,
        }}
        onAddProject={async () => {
          const name = prompt('New project name')?.trim()
          if (name) {
            const p = await addProject(name, pickColor(projects.length))
            setFilter(p.id)
          }
        }}
        onRemoveProject={(id) => {
          if (confirm('Delete this project? Its tasks move to Inbox.')) {
            removeProject(id)
            setFilter('all')
          }
        }}
      />

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
        <Plus width={18} height={18} className="text-faint" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add a task, try &quot;call mom tomorrow p1&quot;"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
        />
      </div>
      {preview && (preview.due_date || preview.priority > 1) && (
        <div className="mt-1.5 flex gap-2 px-1 text-xs text-faint">
          {preview.due_date && <span className="text-accent">{dueLabel(preview.due_date)}</span>}
          {preview.priority > 1 && <span>P{5 - preview.priority}</span>}
        </div>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-faint">Loading</div>
        ) : (
          <TaskList
            filter={filter}
            tasks={tasks}
            projectById={projectById}
            onToggle={(id, done) => patchTask(id, { done })}
            onOpen={(task) => setEditing(task)}
            onClearDone={clearDone}
          />
        )}
      </div>

      {editing && (
        <TaskEditor
          task={editing}
          projects={projects}
          onSave={(patch) => patchTask(editing.id, patch)}
          onDelete={() => removeTask(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function FilterBar({
  filter,
  setFilter,
  projects,
  counts,
  onAddProject,
  onRemoveProject,
}: {
  filter: Filter
  setFilter: (f: Filter) => void
  projects: Project[]
  counts: { today: number; upcoming: number; inbox: number; all: number }
  onAddProject: () => void
  onRemoveProject: (id: number) => void
}) {
  const chip = (active: boolean) =>
    clsx('shrink-0 rounded-full border px-3 py-1.5 text-sm', active ? 'border-line-strong bg-surface2 text-ink' : 'border-line text-dim')
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      <button className={chip(filter === 'today')} onClick={() => setFilter('today')}>
        Today {counts.today > 0 && <span className="text-faint">{counts.today}</span>}
      </button>
      <button className={chip(filter === 'upcoming')} onClick={() => setFilter('upcoming')}>
        Upcoming
      </button>
      <button className={chip(filter === 'inbox')} onClick={() => setFilter('inbox')}>
        Inbox {counts.inbox > 0 && <span className="text-faint">{counts.inbox}</span>}
      </button>
      <button className={chip(filter === 'all')} onClick={() => setFilter('all')}>
        All
      </button>
      {projects.map((p) => (
        <button
          key={p.id}
          className={chip(filter === p.id)}
          onClick={() => setFilter(p.id)}
          onDoubleClick={() => onRemoveProject(p.id)}
          title="double-click to delete"
        >
          <span className="mr-1.5 inline-block size-1.5 rounded-full align-middle" style={{ background: dotColor(p.color) }} />
          {p.name}
        </button>
      ))}
      <button className={chip(false)} onClick={onAddProject} aria-label="add project">
        <Plus width={15} height={15} className="inline align-middle" />
      </button>
    </div>
  )
}

function TaskList({
  filter,
  tasks,
  projectById,
  onToggle,
  onOpen,
  onClearDone,
}: {
  filter: Filter
  tasks: Task[]
  projectById: Map<number, Project>
  onToggle: (id: number, done: boolean) => void
  onOpen: (t: Task) => void
  onClearDone: () => void
}) {
  const t = today()
  const open = tasks.filter((x) => !x.done)
  const byPriority = (a: Task, b: Task) => b.priority - a.priority || (a.due_date || '~').localeCompare(b.due_date || '~')

  const row = (task: Task) => (
    <div key={task.id} className="rise border-b border-line last:border-0">
      <TaskRow task={task} project={task.project_id ? projectById.get(task.project_id) : undefined} onToggle={(d) => onToggle(task.id, d)} onOpen={() => onOpen(task)} />
    </div>
  )

  if (filter === 'today') {
    const overdue = open.filter((x) => x.due_date && x.due_date < t).sort(byPriority)
    const todayList = open.filter((x) => x.due_date === t).sort(byPriority)
    if (!overdue.length && !todayList.length) return <Empty label="Nothing due today. Nice." />
    return (
      <div>
        {overdue.length > 0 && <Section title="Overdue">{overdue.map(row)}</Section>}
        {todayList.length > 0 && <Section title="Today">{todayList.map(row)}</Section>}
      </div>
    )
  }

  if (filter === 'upcoming') {
    const upcoming = open.filter((x) => x.due_date && x.due_date >= t).sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    if (!upcoming.length) return <Empty label="Nothing scheduled." />
    const groups = new Map<string, Task[]>()
    for (const x of upcoming) groups.set(x.due_date!, [...(groups.get(x.due_date!) || []), x])
    return (
      <div>
        {[...groups.entries()].map(([date, list]) => (
          <Section key={date} title={dueLabel(date)}>
            {list.sort(byPriority).map(row)}
          </Section>
        ))}
      </div>
    )
  }

  const scope =
    filter === 'inbox' ? tasks.filter((x) => x.project_id === null) : filter === 'all' ? tasks : tasks.filter((x) => x.project_id === filter)
  const openScope = scope.filter((x) => !x.done).sort(byPriority)
  const doneScope = scope.filter((x) => x.done).sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0))

  return (
    <div>
      {openScope.length ? openScope.map(row) : <Empty label="All clear here." />}
      {doneScope.length > 0 && (
        <div className="mt-6">
          <div className="mb-1 flex items-center justify-between">
            <span className="eyebrow">Completed {doneScope.length}</span>
            <button onClick={onClearDone} className="text-xs text-faint hover:text-red-400">
              clear
            </button>
          </div>
          {doneScope.map(row)}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="eyebrow mb-1">{title}</div>
      {children}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="py-12 text-center text-sm text-faint">{label}</div>
}

const COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'yellow']
function pickColor(i: number) {
  return COLORS[i % COLORS.length]
}
