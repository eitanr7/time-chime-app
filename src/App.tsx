import { useState, useEffect, useRef } from 'react'
import ActiveScreen from './components/ActiveScreen.tsx'
import InactiveScreen from './components/InactiveScreen.tsx'

const CHIME_MINUTE_KEY = 'time-chime-minute'
const CHIME_ACTIVE_KEY = 'time-chime-active'
const THEME_PREFERENCE_KEY = 'time-chime-theme-preference'

type ThemePreference = 'system' | 'dark' | 'light'

let audioCtx: AudioContext | null = null

function formatTime(date: Date, withSeconds = false, prefers24Hour: boolean | null = null): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    ...(prefers24Hour === null ? {} : { hour12: !prefers24Hour }),
    ...(withSeconds ? { second: '2-digit' } : {}),
  }).format(date)
}

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playChime() {
  const ctx = getAudioContext()

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.value = 0.4

  // Gong: inharmonic partials (additive synthesis) – creates metallic, resonant character [ratio, amplitude]
  const baseFreq = 220
  const partials: [number, number][] = [
    [1, 0.8], [1.5, 0.5], [2.37, 0.35], [3.17, 0.2], [4.2, 0.15], [5.5, 0.08],
  ]

  const decay = 3
  const t = ctx.currentTime

  for (const [ratio, amp] of partials) {
    const osc = ctx.createOscillator()
    const envelope = ctx.createGain()

    osc.connect(envelope)
    envelope.connect(masterGain)

    osc.frequency.value = baseFreq * ratio
    osc.type = 'sine'

    envelope.gain.setValueAtTime(0, t)
    envelope.gain.linearRampToValueAtTime(amp * 0.5, t + 0.005)
    envelope.gain.exponentialRampToValueAtTime(0.001, t + decay)
    osc.start(t)
    osc.stop(t + decay)
  }
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light'
}

function getThemePreference(): ThemePreference {
  const saved = localStorage.getItem(THEME_PREFERENCE_KEY)
  return isThemePreference(saved) ? saved : 'system'
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function App() {
  // State persisted between launches.
  const [chimeMinute, setChimeMinute] = useState(() => {
    const saved = localStorage.getItem(CHIME_MINUTE_KEY)
    return saved !== null ? parseInt(saved, 10) : 0
  })
  const [active, setActive] = useState(() => {
    return localStorage.getItem(CHIME_ACTIVE_KEY) === 'true'
  })

  // Runtime state.
  const [now, setNow] = useState(() => new Date())
  const [prefers24Hour, setPrefers24Hour] = useState<boolean | null>(null)
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference())
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => getSystemPrefersDark())

  // Mutable refs to avoid duplicate side effects.
  const lastChimeHour = useRef<number | null>(null)
  const lastSentNextChime = useRef<string | null>(null)

  // Final theme used for styling; follows OS only when preference is "system".
  const resolvedTheme = themePreference === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : themePreference

  // Subscribe once to OS theme changes; used when preference is "system".
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches)
    }

    media.addEventListener('change', handleChange)
    return () => {
      media.removeEventListener('change', handleChange)
    }
  }, [])

  // Keep renderer styling in sync with the resolved theme.
  useEffect(() => {
    const isDark = resolvedTheme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [resolvedTheme])

  // Inform the main process which theme source Electron should use.
  useEffect(() => {
    void window.electronAPI.setThemeSource(themePreference).catch(() => {})
  }, [themePreference])

  useEffect(() => {
    const id = setInterval(() => {
      const date = new Date()
      setNow(date)

      if (!active) return

      const minute = date.getMinutes()
      const hour = date.getHours()

      if (minute === chimeMinute && lastChimeHour.current !== hour) {
        lastChimeHour.current = hour
        playChime()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [active, chimeMinute])

  // Read platform time-format preference once from the main process.
  useEffect(() => {
    let cancelled = false

    window.electronAPI
      .getPrefers24HourTime()
      .then((value) => {
        if (!cancelled) {
          setPrefers24Hour(value)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrefers24Hour(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Keep tray "next chime" text in sync; avoid re-sending unchanged values.
  useEffect(() => {
    if (!active) {
      if (lastSentNextChime.current !== null) {
        window.electronAPI.setNextChime(null)
        lastSentNextChime.current = null
      }
      return
    }

    const minute = now.getMinutes()
    const sec = now.getSeconds()
    const passedThisHour = minute > chimeMinute || (minute === chimeMinute && sec > 0)
    const nextHour = now.getHours() + (passedThisHour ? 1 : 0)
    const nextDate = new Date(now)
    nextDate.setHours(nextHour % 24, chimeMinute, 0, 0)
    const next = formatTime(nextDate, false, prefers24Hour)

    if (lastSentNextChime.current !== next) {
      window.electronAPI.setNextChime(next)
      lastSentNextChime.current = next
    }
  }, [active, chimeMinute, now, prefers24Hour])

  // User-driven updates also persist immediately.
  const handleChimeMinuteChange = (minute: number) => {
    setChimeMinute(minute)
    localStorage.setItem(CHIME_MINUTE_KEY, String(minute))
    lastChimeHour.current = null
  }

  const handleThemeChange = (theme: ThemePreference) => {
    setThemePreference(theme)
    localStorage.setItem(THEME_PREFERENCE_KEY, theme)
  }

  const handleEnable = () => {
    setActive(true)
    localStorage.setItem(CHIME_ACTIVE_KEY, 'true')
  }

  const handleEdit = () => {
    setActive(false)
    localStorage.setItem(CHIME_ACTIVE_KEY, 'false')
  }

  // UI helpers.
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  // Next 12 chime times from now
  const nextChimeTimes = (() => {
    const result: string[] = []
    const min = now.getMinutes()
    const sec = now.getSeconds()
    const passedThisHour = min > chimeMinute || (min === chimeMinute && sec > 0)
    const hour = now.getHours() + (passedThisHour ? 1 : 0)
    for (let i = 0; i < 12; i++) {
      const time = new Date(now)
      time.setHours((hour + i) % 24, chimeMinute, 0, 0)
      result.push(formatTime(time, false, prefers24Hour))
    }
    return result
  })()

  // Settings screen when chime is disabled.
  if (!active) {
    return (
      <InactiveScreen
        chimeMinute={chimeMinute}
        minutes={minutes}
        themePreference={themePreference}
        onThemeChange={handleThemeChange}
        onChimeMinuteChange={handleChimeMinuteChange}
        onTestChime={playChime}
        onEnable={handleEnable}
      />
    )
  }

  // Active screen while chimes are running.
  return (
    <ActiveScreen
      currentTime={formatTime(now, true, prefers24Hour)}
      chimeMinute={chimeMinute}
      nextChimeTimes={nextChimeTimes}
      onEdit={handleEdit}
    />
  )
}

export default App
