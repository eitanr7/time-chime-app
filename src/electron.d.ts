interface ElectronAPI {
  platform: NodeJS.Platform
  getPrefers24HourTime: () => Promise<boolean | null>
  setNextChime: (nextChime: string | null) => void
}

interface Window {
  electronAPI: ElectronAPI
}
