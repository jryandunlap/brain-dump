'use client'

import { type Category, type Task } from '@/lib/supabase'
import TaskCard from './TaskCard'

interface CategoryColumnProps {
  category: Category
  tasks: Task[]
  onTaskDone: (taskId: string) => void
  onTaskSchedule: (task: Task) => void
  onTaskSkip: (taskId: string) => void
}

export default function CategoryColumn({ category, tasks, onTaskDone, onTaskSchedule, onTaskSkip }: CategoryColumnProps) {
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority)

  return (
    <div className="bg-[#131832] border border-[#2d3748] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-[#2d3748]">
        <h3 className="text-base font-bold uppercase tracking-wide" style={{ color: category.color }}>
          {category.name}
        </h3>
        <span className="bg-[#1a1f3a] text-[#00ff9d] px-3 py-1 rounded-xl text-xs font-bold font-mono">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            categoryName={category.name}
            onDone={() => onTaskDone(task.id)}
            onSchedule={() => onTaskSchedule(task)}
            onSkip={() => onTaskSkip(task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tasks in this category
          </div>
        )}
      </div>
    </div>
  )
}
