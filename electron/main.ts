import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let win: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createTrayIcon(): Electron.NativeImage {
  const resourceBase = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(process.env.APP_ROOT!, 'resources')
  const icon = nativeImage.createFromPath(path.join(resourceBase, 'iconTemplate.png'))
  icon.setTemplateImage(true)
  return icon
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      backgroundThrottling: false,
    },
    title: 'Time Chime',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    show: false,
  })

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win?.hide()
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
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('Time Chime')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        win?.show()
        win?.focus()
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

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (win?.isVisible()) {
      win.hide()
    } else {
      win?.show()
      win?.focus()
    }
  })
}

app.on('before-quit', () => {
  isQuitting = true
})

app.on('activate', () => {
  if (win) {
    win.show()
    win.focus()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
