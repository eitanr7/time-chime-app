interface ElectronAPI {
  platform: NodeJS.Platform
  getPrefers24HourTime: () => Promise<boolean | null>
  setThemeSource: (themeSource: 'system' | 'light' | 'dark') => Promise<void>
  setNextChime: (nextChime: string | null) => void
}

interface Window {
  electronAPI: ElectronAPI
}
