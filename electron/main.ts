import { app, BrowserWindow, Tray, Menu, nativeImage, session, ipcMain } from 'electron'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { existsSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let win: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let nextChimeText: string | null = null

function getMacPrefers24HourTime(): boolean | null {
  if (process.platform !== 'darwin') return null

  try {
    const output = execFileSync('defaults', ['read', '-g', 'AppleICUForce24HourTime'], {
      encoding: 'utf8',
    }).trim().toLowerCase()
    return output === '1' || output === 'true'
  } catch {
    try {
      // Fall back to AppleScript time formatting, which reflects Date & Time settings.
      const output = execFileSync(
        'osascript',
        [
          '-e', 'set d to current date',
          '-e', 'set hours of d to 13',
          '-e', 'set minutes of d to 0',
          '-e', 'set seconds of d to 0',
          '-e', 'return time string of d',
        ],
        { encoding: 'utf8' },
      ).trim()

      const hourMatch = output.match(/\d{1,2}/)
      if (!hourMatch) return null

      return Number(hourMatch[0]) >= 13
    } catch {
      return null
    }
  }
}

function hideMainWindow() {
  win?.hide()
  app.dock?.hide()
}

function showMainWindow() {
  app.dock?.show()

  if (!win) return
  if (win.isMinimized()) win.restore()

  win.show()
  win.focus()
}

function getTrayToolTip(): string {
  return nextChimeText ? `Next chime: ${nextChimeText}` : 'Time Chime Off'
}

function getTrayTitle(): string {
  return nextChimeText ?? ''
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: nextChimeText ? `Next chime: ${nextChimeText}` : 'Next chime: Off',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show',
      click: () => {
        showMainWindow()
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])
}

function refreshTrayUI() {
  if (!tray) return
  tray.setImage(createTrayIcon(Boolean(nextChimeText)))
  if (process.platform === 'darwin') {
    tray.setTitle(getTrayTitle())
  }
  tray.setToolTip(getTrayToolTip())
  tray.setContextMenu(buildTrayMenu())
}

function getResourceBasePath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(process.env.APP_ROOT!, 'resources')
}

function resolveTrayIconFile(enabled: boolean): string {
  const resourceBase = getResourceBasePath()

  if (enabled) {
    const activePath = path.join(resourceBase, 'IconTemplateActive.png')
    if (existsSync(activePath)) {
      return activePath
    }
  }

  return path.join(resourceBase, 'iconTemplate.png')
}

function createTrayIcon(enabled = false): Electron.NativeImage {
  const iconPath = resolveTrayIconFile(enabled)
  const icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    const fallback = nativeImage.createFromPath(path.join(getResourceBasePath(), 'iconTemplate.png'))
    fallback.setTemplateImage(true)
    return fallback
  }

  icon.setTemplateImage(true)
  return icon
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 480,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      backgroundThrottling: false,
    },
    title: 'Time Chime',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#0a0a0a',
    show: false,
  })

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      hideMainWindow()
    }
  })

  win.on('ready-to-show', () => {
    win?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createTray() {
  const icon = createTrayIcon(Boolean(nextChimeText))
  tray = new Tray(icon)
  refreshTrayUI()
}

app.on('before-quit', () => {
  isQuitting = true
})

app.on('activate', () => {
  if (win && app.dock?.isVisible()) {
    showMainWindow()
  }
})

app.whenReady().then(() => {
  if (!VITE_DEV_SERVER_URL) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
          ],
        },
      })
    })
  }

  createWindow()
  createTray()
})

ipcMain.on('tray:set-next-chime', (_event, value: unknown) => {
  nextChimeText = typeof value === 'string' ? value : null
  refreshTrayUI()
})

ipcMain.handle('system:get-prefers-24-hour-time', () => {
  return getMacPrefers24HourTime()
})

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
