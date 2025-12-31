'use client'

interface BottomNavProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'categories', icon: '📁', label: 'All' },
    { id: 'stats', icon: '📊', label: 'Stats' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f3a] border-t border-[#2d3748] px-2 pt-3 pb-2 flex justify-around z-50 shadow-lg">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onPageChange(item.id)}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[70px] transition-colors ${
            currentPage === item.id
              ? 'bg-[#00ff9d]/10 text-[#00ff9d]'
              : 'text-gray-400'
          }`}
        >
          <div className="text-2xl leading-none">{item.icon}</div>
          <div className="text-xs font-semibold uppercase tracking-wide">{item.label}</div>
        </button>
      ))}
    </div>
  )
}
