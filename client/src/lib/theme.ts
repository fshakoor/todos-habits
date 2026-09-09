// Two dark presets: OLED (pure black) and a softer dark. The choice is a data
// attribute on the root element that the CSS reads, saved to localStorage.
export type ThemeMode = 'oled' | 'dark'

const KEY = 'th-theme'

export function loadTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'oled' || v === 'dark') return v
  } catch {
    // ignore unreadable storage
  }
  return 'oled'
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
  document.documentElement.style.colorScheme = 'dark'
}

export function saveTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // ignore unwritable storage
  }
  applyTheme(mode)
}
