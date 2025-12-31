'use client'

import { useState } from 'react'
import { type Category } from '@/lib/supabase'

interface OnboardingModalProps {
  onComplete: (data: {
    quarterGoals: string
    yearGoals: string
    categories: Array<Partial<Category>>
  }) => void
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [quarterGoals, setQuarterGoals] = useState('')
  const [yearGoals, setYearGoals] = useState('')

  const defaultCategories: Array<Partial<Category>> = [
    {
      name: 'Work',
      color: '#00ff9d',
      description: 'My day job and career',
      goals: '',
      time_allocation: '40 hrs/week',
      priority: 1,
    },
    {
      name: 'Personal',
      color: '#00d4ff',
      description: 'Personal care, health, and self-improvement',
      goals: '',
      time_allocation: '10 hrs/week',
      priority: 2,
    },
    {
      name: 'Family',
      color: '#ff6b9d',
      description: 'Time with family and loved ones',
      goals: '',
      time_allocation: '15 hrs/week',
      priority: 3,
    },
  ]

  function handleComplete() {
    onComplete({
      quarterGoals,
      yearGoals,
      categories: defaultCategories,
    })
  }

  return (
    <div className="fixed inset-0 bg-[#0a0e27] z-50 flex items-center justify-center p-5">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-5xl font-bold font-mono bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent mb-4 animate-pulse">
          BRAIN DUMP
        </h1>
        <p className="text-lg text-gray-400 mb-12">Clear your mind. Own your time.</p>

        <div className="bg-[#1a1f3a] border-2 border-[#2d3748] rounded-3xl p-8 text-left">
          <h2 className="text-2xl font-bold text-center mb-8">Let's Set Your Goals</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Your Goals for This Quarter
              </label>
              <textarea
                value={quarterGoals}
                onChange={(e) => setQuarterGoals(e.target.value)}
                placeholder="e.g., Launch MVP, refinance properties, spend quality time with family"
                rows={3}
                className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Your Goals for This Year
              </label>
              <textarea
                value={yearGoals}
                onChange={(e) => setYearGoals(e.target.value)}
                placeholder="e.g., Build sustainable passive income, achieve work-life balance, improve health"
                rows={3}
                className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full mt-8 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-4 rounded-xl font-bold text-base uppercase tracking-wide active:scale-95 transition-transform"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  )
}
