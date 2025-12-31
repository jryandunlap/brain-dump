'use client'

interface StatsBarProps {
  streak: number
  completedThisWeek: number
  totalPoints: number
  quickWins: number
}

export default function StatsBar({ streak, completedThisWeek, totalPoints, quickWins }: StatsBarProps) {
  return (
    <div className="flex gap-3 overflow-x-auto mb-6 pb-1 scrollbar-hide">
      <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-4 min-w-[140px] flex-shrink-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Streak</div>
        <div className="text-2xl font-bold text-[#00ff9d] font-mono leading-none">{streak}d</div>
        <div className="text-xs text-gray-500 mt-1">🔥 Keep going!</div>
      </div>
      <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-4 min-w-[140px] flex-shrink-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">This Week</div>
        <div className="text-2xl font-bold text-[#00ff9d] font-mono leading-none">{completedThisWeek}</div>
        <div className="text-xs text-gray-500 mt-1">+12% up</div>
      </div>
      <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-4 min-w-[140px] flex-shrink-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Points</div>
        <div className="text-2xl font-bold text-[#00ff9d] font-mono leading-none">
          {(totalPoints / 1000).toFixed(1)}k
        </div>
        <div className="text-xs text-gray-500 mt-1">Level 8</div>
      </div>
      <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-4 min-w-[140px] flex-shrink-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Quick</div>
        <div className="text-2xl font-bold text-[#00ff9d] font-mono leading-none">{quickWins}</div>
        <div className="text-xs text-gray-500 mt-1">{'< 5min'}</div>
      </div>
    </div>
  )
}
