'use client'

import { type Task } from '@/lib/supabase'

interface TaskCardProps {
  task: Task
  categoryName?: string
  onDone: () => void
  onSchedule: () => void
  onSkip: () => void
}

export default function TaskCard({ task, categoryName, onDone, onSchedule, onSkip }: TaskCardProps) {
  const daysOld = Math.floor((Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24))

  const urgencyColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  const urgencyEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }

  return (
    <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-5 relative overflow-hidden active:scale-[0.98] transition-transform">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff9d]" />
      
      <div className="mb-3">
        <h3 className="text-base font-semibold leading-snug">{task.title}</h3>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {categoryName && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30">
            {categoryName}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${urgencyColors[task.urgency]}`}>
          {urgencyEmoji[task.urgency]} {task.urgency.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700/20 text-gray-400 border border-gray-700/30">
          {daysOld}d old
        </span>
        {task.effort && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700/20 text-gray-400 border border-gray-700/30">
            ⏱️ {task.effort}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDone}
          className="flex-1 bg-gradient-to-r from-[#00ff9d] to-[#00cc7a] text-[#0a0e27] px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wide active:scale-95 transition-transform min-h-[48px]"
        >
          ✓ Done
        </button>
        <button
          onClick={onSchedule}
          className="flex-1 bg-[#131832] border-2 border-[#00d4ff] text-[#00d4ff] px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wide active:scale-95 transition-transform min-h-[48px]"
        >
          📅 Schedule
        </button>
        <button
          onClick={onSkip}
          className="bg-transparent border-2 border-[#2d3748] text-gray-400 px-4 py-3 rounded-lg text-xs font-bold active:scale-95 transition-transform min-h-[48px]"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
