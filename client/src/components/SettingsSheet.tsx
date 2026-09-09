import type { ThemeMode } from '../lib/theme'
import { Modal, Segmented } from './Modal'

export function SettingsSheet({ theme, setTheme, onClose }: { theme: ThemeMode; setTheme: (m: ThemeMode) => void; onClose: () => void }) {
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="mb-1.5 text-xs text-faint">Theme</div>
      <Segmented
        options={[
          { key: 'oled', label: 'OLED' },
          { key: 'dark', label: 'Dark' },
        ]}
        value={theme}
        onChange={setTheme}
      />
      <p className="mt-4 text-xs leading-relaxed text-faint">
        Everything is stored locally in a SQLite file on the machine running this. Reach it from your phone over Tailscale.
      </p>
    </Modal>
  )
}
