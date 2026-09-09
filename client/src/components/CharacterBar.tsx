import type { Stats } from '../lib/api'

const xpForLevel = (level: number) => 25 * level + 25

function Bar({ label, value, max, color, right }: { label: string; value: number; max: number; color: string; right: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[11px]">
        <span className="text-faint">{label}</span>
        <span className="num text-dim">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface2">
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function CharacterBar({ stats }: { stats: Stats }) {
  const need = xpForLevel(stats.level)
  return (
    <div className="card card-sheen p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent num">
            {stats.level}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-medium">Level {stats.level}</div>
            <div className="text-[11px] text-faint">adventurer</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-yellow-400">&#9679;</span>
          <span className="num text-ink">{stats.gold.toFixed(1)}</span>
          <span className="text-faint">gold</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Bar label="Health" value={stats.hp} max={stats.max_hp} color="#ef4444" right={`${Math.round(stats.hp)}/${stats.max_hp}`} />
        <Bar label="Experience" value={stats.xp} max={need} color="var(--color-accent)" right={`${Math.round(stats.xp)}/${need}`} />
      </div>
    </div>
  )
}
