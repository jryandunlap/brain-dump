'use client'

import { useState } from 'react'

interface BrainDumpInputProps {
  onSubmit: (text: string) => Promise<boolean>
}

export default function BrainDumpInput({ onSubmit }: BrainDumpInputProps) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return

    setProcessing(true)
    const success = await onSubmit(text)
    if (success) {
      setText('')
    }
    setProcessing(false)
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#131832] border-2 border-[#2d3748] rounded-2xl p-5 mb-8 shadow-lg shadow-[#00ff9d]/10">
      <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
        🧠 Dump It All Here
      </h3>
      <textarea
        className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-xl p-4 text-white resize-none focus:border-[#00ff9d] focus:outline-none transition-colors min-h-[100px]"
        placeholder="Just start typing... bills, tasks, ideas, worries. Get it all out."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={processing}
      />
      <button
        onClick={handleSubmit}
        disabled={processing || !text.trim()}
        className="w-full mt-3 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
      >
        {processing ? 'Processing...' : 'Process Brain Dump'}
      </button>
    </div>
  )
}
