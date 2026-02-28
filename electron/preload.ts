import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getPrefers24HourTime() {
    return ipcRenderer.invoke('system:get-prefers-24-hour-time') as Promise<boolean | null>
  },
  setNextChime(nextChime: string | null) {
    ipcRenderer.send('tray:set-next-chime', nextChime)
  },
})
