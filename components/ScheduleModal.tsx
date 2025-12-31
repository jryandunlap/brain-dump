'use client'

import { useState, useEffect } from 'react'
import { type Task } from '@/lib/supabase'

interface ScheduleModalProps {
  isOpen: boolean
  task: Task | null
  onClose: () => void
  onConfirm: (date: string, time: string) => void
}

export default function ScheduleModal({ isOpen, task, onClose, onConfirm }: ScheduleModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setDate(tomorrow.toISOString().split('T')[0])
      setTime('09:00')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !task) return null

  return (
    <div 
      className="fixed inset-0 bg-[#0a0e27]/95 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1f3a] border-2 border-[#00ff9d] rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-5 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
          📅 Schedule This Task
        </h3>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Task
          </label>
          <div className="bg-[#0a0e27] rounded-lg p-3 text-white">
            {task.title}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none min-h-[48px]"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none min-h-[48px]"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border-2 border-[#2d3748] text-gray-400 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wide active:scale-95 transition-transform min-h-[52px]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(date, time)}
            className="flex-1 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wide active:scale-95 transition-transform min-h-[52px]"
          >
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  )
}
