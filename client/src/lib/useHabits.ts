import { useCallback, useEffect, useState } from 'react'
import { api, type Daily, type Difficulty, type Gained, type Habit, type Stats } from './api'

// Loads the character board and drives the habit and daily actions. Taps and
// checks return what was gained so a card can float the number on screen.
export function useHabits() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [dailies, setDailies] = useState<Daily[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const b = await api.board()
    setStats(b.stats)
    setHabits(b.habits)
    setDailies(b.dailies)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload().catch(() => setLoading(false))
  }, [reload])

  const tap = useCallback(async (id: number, dir: 1 | -1): Promise<{ gained: Gained; leveledUp: boolean }> => {
    const before = stats?.level ?? 1
    const { habit, stats: next, gained } = await api.tapHabit(id, dir)
    setHabits((cur) => cur.map((h) => (h.id === id ? habit : h)))
    setStats(next)
    return { gained, leveledUp: next.level > before }
  }, [stats])

  const check = useCallback(async (id: number, done: boolean): Promise<{ gained: Gained; leveledUp: boolean }> => {
    const before = stats?.level ?? 1
    const { daily, stats: next, gained } = await api.checkDaily(id, done)
    setDailies((cur) => cur.map((d) => (d.id === id ? daily : d)))
    setStats(next)
    return { gained, leveledUp: next.level > before }
  }, [stats])

  const addHabit = useCallback(async (name: string, difficulty: Difficulty) => {
    const h = await api.createHabit({ name, difficulty })
    setHabits((cur) => [...cur, h])
  }, [])
  const patchHabit = useCallback(async (id: number, patch: Partial<Habit>) => {
    setHabits((cur) => cur.map((h) => (h.id === id ? { ...h, ...patch } : h)))
    const saved = await api.updateHabit(id, patch)
    setHabits((cur) => cur.map((h) => (h.id === id ? saved : h)))
  }, [])
  const removeHabit = useCallback(async (id: number) => {
    setHabits((cur) => cur.filter((h) => h.id !== id))
    await api.removeHabit(id)
  }, [])

  const addDaily = useCallback(async (name: string, difficulty: Difficulty, days: number[]) => {
    const d = await api.createDaily({ name, difficulty, days })
    setDailies((cur) => [...cur, d])
  }, [])
  const patchDaily = useCallback(async (id: number, patch: Partial<Daily>) => {
    setDailies((cur) => cur.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    const saved = await api.updateDaily(id, patch)
    setDailies((cur) => cur.map((d) => (d.id === id ? saved : d)))
  }, [])
  const removeDaily = useCallback(async (id: number) => {
    setDailies((cur) => cur.filter((d) => d.id !== id))
    await api.removeDaily(id)
  }, [])

  return {
    stats,
    habits,
    dailies,
    loading,
    reload,
    tap,
    check,
    addHabit,
    patchHabit,
    removeHabit,
    addDaily,
    patchDaily,
    removeDaily,
  }
}
