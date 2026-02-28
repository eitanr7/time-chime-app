import { contextBridge, ipcRenderer } from 'electron'

// Expose a minimal, typed API surface to the renderer.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getPrefers24HourTime() {
    return ipcRenderer.invoke('system:get-prefers-24-hour-time') as Promise<boolean | null>
  },
  setThemeSource(themeSource: 'system' | 'light' | 'dark') {
    return ipcRenderer.invoke('system:set-theme-source', themeSource) as Promise<void>
  },
  setNextChime(nextChime: string | null) {
    ipcRenderer.send('tray:set-next-chime', nextChime)
  },
})
