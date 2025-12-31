'use client'

import { useEffect, useState } from 'react'
import { supabase, type Category, type Task, type Goals } from '@/lib/supabase'
import BrainDumpInput from '@/components/BrainDumpInput'
import TaskCard from '@/components/TaskCard'
import CategoryColumn from '@/components/CategoryColumn'
import ScheduleModal from '@/components/ScheduleModal'
import CategoryModal from '@/components/CategoryModal'
import OnboardingModal from '@/components/OnboardingModal'
import StatsBar from '@/components/StatsBar'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goals | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      return
    }

    setUser(session.user)
    await loadUserData(session.user.id)
  }

  async function loadUserData(userId: string) {
    setLoading(true)

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false })

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    setCategories(categoriesData || [])
    setTasks(tasksData || [])
    setGoals(goalsData)

    if (!categoriesData?.length || !goalsData) {
      setShowOnboarding(true)
    }

    setLoading(false)
  }

  async function handleBrainDump(text: string) {
    if (!user) return false

    const response = await fetch('/api/brain-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dumpText: text, userId: user.id }),
    })

    if (response.ok) {
      await loadUserData(user.id)
      return true
    }
    return false
  }

  async function handleTaskDone(taskId: string) {
    await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', taskId)

    setTasks(tasks.filter(t => t.id !== taskId))
  }

  async function handleTaskSchedule(task: Task) {
    setSelectedTask(task)
    setScheduleModalOpen(true)
  }

  async function handleScheduleConfirm(date: string, time: string) {
    if (!selectedTask) return

    const scheduledDate = new Date(`${date}T${time}`)
    
    await supabase
      .from('tasks')
      .update({ 
        status: 'scheduled',
        scheduled_date: scheduledDate.toISOString()
      })
      .eq('id', selectedTask.id)

    await loadUserData(user.id)
    setScheduleModalOpen(false)
    setSelectedTask(null)
  }

  async function handleTaskSkip(taskId: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    await supabase
      .from('tasks')
      .update({ priority: Math.max(0, task.priority - 10) })
      .eq('id', taskId)

    await loadUserData(user.id)
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  function handleAddCategory() {
    setEditingCategory(null)
    setCategoryModalOpen(true)
  }

  async function handleSaveCategory(categoryData: Partial<Category>) {
    if (!user) return

    if (editingCategory) {
      await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id)
    } else {
      await supabase
        .from('categories')
        .insert({ ...categoryData, user_id: user.id })
    }

    await loadUserData(user.id)
    setCategoryModalOpen(false)
    setEditingCategory(null)
  }

  async function handleDeleteCategory(categoryId: string) {
    await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    await loadUserData(user.id)
  }

  async function handleOnboardingComplete(data: { quarterGoals: string; yearGoals: string; categories: Array<Partial<Category>> }) {
    if (!user) return

    await supabase
      .from('goals')
      .upsert({
        user_id: user.id,
        quarter_goals: data.quarterGoals,
        year_goals: data.yearGoals,
      })

    for (const cat of data.categories) {
      await supabase
        .from('categories')
        .insert({ ...cat, user_id: user.id })
    }

    setShowOnboarding(false)
    await loadUserData(user.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-2xl font-bold text-[#00ff9d]">Loading...</div>
      </div>
    )
  }

  const top5Tasks = [...tasks]
    .filter(t => t.status === 'pending')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)

  const tasksByCategory = categories.map(cat => ({
    category: cat,
    tasks: tasks.filter(t => t.category_id === cat.id)
  }))

  const completedThisWeek = tasks.filter(t => {
    if (t.status !== 'done') return false
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(t.updated_at) > weekAgo
  }).length

  return (
    <>
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      <div className="min-h-screen bg-[#0a0e27] text-white pb-20">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent font-mono">
              BRAIN DUMP
            </h1>
            <p className="text-sm text-gray-400">Clear your mind. Own your time.</p>
          </div>

          {currentPage === 'home' && (
            <>
              <StatsBar 
                streak={7}
                completedThisWeek={completedThisWeek}
                totalPoints={1847}
                quickWins={tasks.filter(t => t.effort && t.effort.includes('m') && parseInt(t.effort) < 5).length}
              />

              <BrainDumpInput onSubmit={handleBrainDump} />

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold">Next 5</h2>
                  <span className="bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-3 py-1 rounded-full text-xs font-bold">
                    TOP
                  </span>
                </div>
                <div className="space-y-3">
                  {top5Tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      categoryName={categories.find(c => c.id === task.category_id)?.name}
                      onDone={() => handleTaskDone(task.id)}
                      onSchedule={() => handleTaskSchedule(task)}
                      onSkip={() => handleTaskSkip(task.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {currentPage === 'categories' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">All Categories</h2>
              {tasksByCategory.map(({ category, tasks: categoryTasks }) => (
                <CategoryColumn
                  key={category.id}
                  category={category}
                  tasks={categoryTasks}
                  onTaskDone={handleTaskDone}
                  onTaskSchedule={handleTaskSchedule}
                  onTaskSkip={handleTaskSkip}
                />
              ))}
            </div>
          )}

          {currentPage === 'stats' && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Monthly Retro Coming Soon</h3>
              <p className="text-gray-400">Track time across categories and get insights</p>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Settings</h2>
              
              <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                  🎯 Your Goals
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                      Quarter Goals
                    </label>
                    <textarea
                      className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white"
                      rows={2}
                      value={goals?.quarter_goals || ''}
                      onChange={async (e) => {
                        await supabase.from('goals').upsert({ user_id: user.id, quarter_goals: e.target.value })
                        setGoals({ ...goals!, quarter_goals: e.target.value })
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                      Year Goals
                    </label>
                    <textarea
                      className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white"
                      rows={2}
                      value={goals?.year_goals || ''}
                      onChange={async (e) => {
                        await supabase.from('goals').upsert({ user_id: user.id, year_goals: e.target.value })
                        setGoals({ ...goals!, year_goals: e.target.value })
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                  📁 Life Categories
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Define your life categories with context so AI can prioritize intelligently.
                </p>
                
                <div className="space-y-3">
                  {categories.map(category => (
                    <div key={category.id} className="bg-[#131832] border border-[#2d3748] rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className="w-1 bg-current rounded" style={{ color: category.color }} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold">{category.name}</h4>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span className="text-xs bg-[#00ff9d]/20 text-[#00ff9d] px-2 py-1 rounded">
                                  #{category.priority} Priority
                                </span>
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                  {tasks.filter(t => t.category_id === category.id).length} tasks
                                </span>
                              </div>
                            </div>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-400 mb-2">{category.description}</p>
                          )}
                          {category.goals && (
                            <p className="text-sm text-gray-500 mb-3">🎯 {category.goals}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="flex-1 bg-[#1a1f3a] border-2 border-[#00d4ff] text-[#00d4ff] px-4 py-2 rounded-lg text-sm font-bold"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-[#1a1f3a] border-2 border-[#2d3748] text-gray-400 px-4 py-2 rounded-lg text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddCategory}
                  className="w-full mt-4 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-3 rounded-xl font-bold"
                >
                  + Add New Category
                </button>
              </div>
            </div>
          )}
        </div>

        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      <ScheduleModal
        isOpen={scheduleModalOpen}
        task={selectedTask}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleScheduleConfirm}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        category={editingCategory}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
      />
    </>
  )
}
