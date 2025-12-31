'use client'

import { useState, useEffect } from 'react'
import { type Category } from '@/lib/supabase'

interface CategoryModalProps {
  isOpen: boolean
  category: Category | null
  onClose: () => void
  onSave: (data: Partial<Category>) => void
}

export default function CategoryModal({ isOpen, category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#00ff9d')
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState('')
  const [timeAllocation, setTimeAllocation] = useState('')
  const [priority, setPriority] = useState(1)

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name)
        setColor(category.color)
        setDescription(category.description || '')
        setGoals(category.goals || '')
        setTimeAllocation(category.time_allocation || '')
        setPriority(category.priority)
      } else {
        setName('')
        setColor('#00ff9d')
        setDescription('')
        setGoals('')
        setTimeAllocation('')
        setPriority(1)
      }
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, category])

  if (!isOpen) return null

  function handleSave() {
    onSave({
      name,
      color,
      description: description || null,
      goals: goals || null,
      time_allocation: timeAllocation || null,
      priority,
    })
  }

  return (
    <div 
      className="fixed inset-0 bg-[#0a0e27]/95 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1f3a] border-2 border-[#00ff9d] rounded-t-3xl p-6 w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-5 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
          {category ? `✏️ Edit ${category.name}` : '📁 New Category'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Side Business, Health, Family"
              disabled={!!category}
              className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none disabled:opacity-60 min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-12 border-2 border-[#2d3748] rounded-lg bg-transparent cursor-pointer"
              />
              <span className="text-sm text-gray-400">Pick a color to identify this category</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this category represent? e.g., My side business building productivity apps"
              rows={2}
              className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Goals & Purpose
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What are you trying to achieve? e.g., Launch MVP by Q1, reach $5k MRR by year end"
              rows={2}
              className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Time Allocation
            </label>
            <input
              type="text"
              value={timeAllocation}
              onChange={(e) => setTimeAllocation(e.target.value)}
              placeholder="e.g., 10 hrs/week, 2 hrs/day, high priority this quarter"
              className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Priority Level (1 = highest)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
              placeholder="1-20"
              className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none min-h-[48px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers = higher priority. AI uses this to rank tasks.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border-2 border-[#2d3748] text-gray-400 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wide active:scale-95 transition-transform min-h-[52px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform min-h-[52px]"
          >
            Save Category
          </button>
        </div>
      </div>
    </div>
  )
}
