import { Bell, BellDotIcon, BellRingIcon, Moon, Sun, SunMoon } from 'lucide-react'

type ThemePreference = 'system' | 'dark' | 'light'

interface InactiveScreenProps {
  chimeMinute: number
  minutes: number[]
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  onChimeMinuteChange: (minute: number) => void
  onTestChime: () => void
  onEnable: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

function InactiveScreen({
  chimeMinute,
  minutes,
  themePreference,
  onThemeChange,
  onChimeMinuteChange,
  onTestChime,
  onEnable,
}: InactiveScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="flex items-center gap-2 mb-8 text-indigo-600 dark:text-indigo-500">
        <BellDotIcon className="w-5 h-5" strokeWidth={1.5} />
      </div>

      {/* Current schedule summary */}
      <h2 className="text-xl font-medium text-neutral-700 dark:text-neutral-300 mb-8">You will get a chime at <span className="text-indigo-600 dark:text-indigo-500 font-medium">:{pad(chimeMinute)}</span> every hour</h2>

      <div className="w-full max-w-sm space-y-6">
        <div>
          {/* Minute picker for :00 through :59 */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {minutes.map((m) => (
              <button
                key={m}
                onClick={() => onChimeMinuteChange(m)}
                className={`w-8 h-8 rounded-full text-sm transition-colors ${
                  m === chimeMinute
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white'
                }`}
              >
                {pad(m)}
              </button>
            ))}
          </div>
        </div>

        {/* Primary actions */}
        <div className="flex justify-center gap-3 mt-12">
          <button
            onClick={onTestChime}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-200 transition-colors"
          >
            <BellRingIcon className="w-5 h-5" />
            <span className="font-medium">Test chime</span>
          </button>
          <button
            onClick={onEnable}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span>Enable</span>
          </button>
        </div>

        {/* Theme preference controls */}
        <div className="pt-1 flex items-center justify-center gap-1.5 mt-12">
          <button
            onClick={() => onThemeChange('system')}
            aria-label="Use system theme"
            title="System theme"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              themePreference === 'system'
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/80'
            }`}
          >
            <SunMoon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onThemeChange('light')}
            aria-label="Use light theme"
            title="Light theme"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              themePreference === 'light'
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/80'
            }`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            aria-label="Use dark theme"
            title="Dark theme"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              themePreference === 'dark'
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/80'
            }`}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InactiveScreen
