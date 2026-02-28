import { BellDotIcon, BellOff } from 'lucide-react'

interface ActiveScreenProps {
  currentTime: string
  chimeMinute: number
  nextChimeTimes: string[]
  onEdit: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

function ActiveScreen({ currentTime, chimeMinute, nextChimeTimes, onEdit }: ActiveScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="flex items-center gap-2 mb-8 text-indigo-600 dark:text-indigo-500">
        <BellDotIcon className="w-5 h-5" strokeWidth={1.5} />
      </div>

      {/* Current time display */}
      <div className="text-6xl sm:text-7xl font-light tabular-nums mb-8">
        {currentTime}
      </div>

      <div className="w-full max-w-sm">
        {/* Chime schedule summary + upcoming times */}
        <p className="text-neutral-500 dark:text-neutral-500 text-sm mb-2 text-center">
          Chimes at :{pad(chimeMinute)} every hour
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {nextChimeTimes.map((time, index) => (
            <span
              key={`${time}-${index}`}
              className="px-3 py-1.5 rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300 text-sm font-mono"
            >
              {time}
            </span>
          ))}
        </div>
      </div>

      {/* Exit active mode and return to settings */}
      <div className="mt-8">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/80 transition-colors"
        >
          <BellOff className="w-5 h-5" />
          <span className="text-sm font-medium">Edit</span>
        </button>
      </div>
    </div>
  )
}

export default ActiveScreen
