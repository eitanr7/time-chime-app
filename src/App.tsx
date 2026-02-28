import { useState, useEffect, useRef } from 'react'
import { Clock, Bell, Settings } from 'lucide-react'

const CHIME_MINUTE_KEY = 'time-chime-minute'

function playChime() {
  const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  const masterGain = audioContext.createGain()
  masterGain.connect(audioContext.destination)
  masterGain.gain.value = 0.4

  // Gong: inharmonic partials (additive synthesis) – creates metallic, resonant character [ratio to the fundamental frequency, amplitude]
  const baseFreq = 220 // fundamental frequency (A3)
  const partials: [number, number][] = [
    [1, 0.8], [1.5, 0.5], [2.37, 0.35], [3.17, 0.2], [4.2, 0.15], [5.5, 0.08],
  ]

  /* decay time in seconds */
  const decay = 3

  for (const [ratio, amp] of partials) {
    /* create oscillator */
    const osc = audioContext.createOscillator()

    /* create envelope gain node */
    const envelope = audioContext.createGain()

    /* connect oscillator -> envelope -> master gain */
    osc.connect(envelope)
    envelope.connect(masterGain)

    /* set frequency */
    osc.frequency.value = baseFreq * ratio

    /* set type to sine */
    osc.type = 'sine'

    /* shape the amplitude envelope: instant attack, exponential decay */
    envelope.gain.setValueAtTime(0, 0)
    envelope.gain.linearRampToValueAtTime(amp * 0.5, 0.005)
    envelope.gain.exponentialRampToValueAtTime(0.001, decay)
    /* start oscillator */
    osc.start(0)
    /* stop oscillator after decay seconds */
    osc.stop(decay)
  }
}

function App() {
  const [chimeMinute, setChimeMinute] = useState(() => {
    const saved = localStorage.getItem(CHIME_MINUTE_KEY)
    return saved !== null ? parseInt(saved, 10) : 0
  })
  const [active, setActive] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const lastChimeMinute = useRef<number | null>(null)

  useEffect(() => {
    localStorage.setItem(CHIME_MINUTE_KEY, String(chimeMinute))
  }, [chimeMinute])

  useEffect(() => {
    const id = setInterval(() => {
      const date = new Date()
      setNow(date)

      if (!active) return

      const minute = date.getMinutes()
      const seconds = date.getSeconds()

      if (minute === chimeMinute && seconds < 1) {
        if (lastChimeMinute.current !== chimeMinute) {
          lastChimeMinute.current = chimeMinute
          playChime()
        }
      } else if (minute !== chimeMinute) {
        lastChimeMinute.current = null
      }
    }, 1000)
    return () => clearInterval(id)
  }, [active, chimeMinute])

  const handleEnable = () => {
    playChime()
    setActive(true)
  }

  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const pad = (n: number) => n.toString().padStart(2, '0')

  // Next 12 chime times from now
  const nextChimeTimes = (() => {
    const result: string[] = []
    const min = now.getMinutes()
    const sec = now.getSeconds()
    const passedThisHour = min > chimeMinute || (min === chimeMinute && sec > 0)
    let hour = now.getHours() + (passedThisHour ? 1 : 0)
    for (let i = 0; i < 12; i++) {
      result.push(`${pad((hour + i) % 24)}:${pad(chimeMinute)}`)
    }
    return result
  })()

  // Settings screen
  if (!active) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-neutral-950 text-white">
        <div className="flex items-center gap-2 mb-8 text-amber-400">
          <Clock className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-sm font-medium tracking-wider uppercase">Time Chime</span>
        </div>

        <h2 className="text-xl font-medium text-neutral-300 mb-8">Configure your chime</h2>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <label className="block text-sm text-neutral-400 mb-3">
              Chime at <span className="text-amber-400 font-medium">:{pad(chimeMinute)}</span> every hour
            </label>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {minutes.map((m) => (
                <button
                  key={m}
                  onClick={() => setChimeMinute(m)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    m === chimeMinute
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => playChime()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 transition-colors text-neutral-200"
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Test chime</span>
            </button>
            <button
              onClick={handleEnable}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span>Enable</span>
            </button>
          </div>

          <p className="text-center text-xs text-neutral-500">
            The chime will play when you enable so your browser allows hourly chimes
          </p>
        </div>
      </div>
    )
  }

  // Clock / active screen
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-neutral-950 text-white">
      <div className="mb-8">
        <button
          onClick={() => setActive(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2 text-amber-400">
        <Clock className="w-5 h-5" strokeWidth={1.5} />
        <span className="text-sm font-medium tracking-wider uppercase">Time Chime</span>
      </div>

      <div className="text-6xl sm:text-7xl font-light tabular-nums mb-4">
        {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
      </div>

      <p className="text-neutral-500 text-sm mb-10">
        Chimes at :{pad(chimeMinute)} every hour
      </p>

      <div className="w-full max-w-sm">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Upcoming chimes</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {nextChimeTimes.map((time) => (
            <span
              key={time}
              className="px-3 py-1.5 rounded-lg bg-neutral-800/80 text-neutral-300 text-sm font-mono"
            >
              {time}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
