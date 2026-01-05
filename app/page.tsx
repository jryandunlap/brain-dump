'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Category, Task, Goals } from '@/lib/supabase'
import BrainDumpInput from '@/components/BrainDumpInput'
import TaskCard from '@/components/TaskCard'
import CategoryColumn from '@/components/CategoryColumn'
import ScheduleModal from '@/components/ScheduleModal'
import CategoryModal from '@/components/CategoryModal'
import OnboardingModal from '@/components/OnboardingModal'
import TaskDetailModal from '@/components/TaskDetailModal'
import StatsBar from '@/components/StatsBar'
import BottomNav from '@/components/BottomNav'
import BrainDumpModal from '@/components/BrainDumpModal'
import StatsPage from '@/components/StatsPage'

export default function Home() {
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
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
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showBrainDumpModal, setShowBrainDumpModal] = useState(false)
  const [showCompletedModal, setShowCompletedModal] = useState(false)
  const [isFrenzyMode, setIsFrenzyMode] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [unschedulingTaskId, setUnschedulingTaskId] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
    
    // Check for Google Calendar tokens in URL
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('google_access_token')
    const refreshToken = params.get('google_refresh_token')
    
    if (accessToken) {
      setGoogleAccessToken(accessToken)
      localStorage.setItem('google_access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken)
      }
      window.history.replaceState({}, '', '/')
    } else {
      const stored = localStorage.getItem('google_access_token')
      if (stored) setGoogleAccessToken(stored)
    }
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      setLoading(false)
      return
    }

    setUser(session.user)
    await loadUserData(session.user.id)
  }

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
  }

  async function refreshGoogleToken() {
    const refreshToken = localStorage.getItem('google_refresh_token')
    if (!refreshToken) {
      console.error('No refresh token available')
      return null
    }

    try {
      const response = await fetch('/api/google-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()
      
      if (data.access_token) {
        localStorage.setItem('google_access_token', data.access_token)
        setGoogleAccessToken(data.access_token)
        return data.access_token
      }
      
      return null
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  async function loadUserData(userId: string, showLoading = true) {
    if (showLoading) {
      setLoading(true)
    }

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
      .maybeSingle()

    setCategories(categoriesData || [])
    setTasks(tasksData || [])
    setGoals(goalsData)

    // Only check onboarding on initial load (when showLoading is true)
    if (showLoading && (!categoriesData?.length || !goalsData)) {
      setShowOnboarding(true)
    }

    if (showLoading) {
      setLoading(false)
    }
  }

  // Calculate real stats
  const calculateStreak = () => {
    const completedTasks = tasks.filter(t => t.status === 'done')
    if (completedTasks.length === 0) return 0

    // Sort by completion date descending
    const sorted = completedTasks.sort((a, b) => 
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if there's a task from today or yesterday
    const mostRecentTask = sorted[0]
    const mostRecentDate = new Date(mostRecentTask.updated_at || mostRecentTask.created_at)
    mostRecentDate.setHours(0, 0, 0, 0)
    
    // If most recent task is older than yesterday, streak is 0
    if (mostRecentDate < yesterday) return 0

    // Start counting from the most recent task date
    let streak = 0
    let currentDate = new Date(mostRecentDate)

    for (const task of sorted) {
      const taskDate = new Date(task.updated_at || task.created_at)
      taskDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else if (diffDays > streak) {
        break
      }
    }

    return streak
  }

  const calculateWeeklyCompleted = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return tasks.filter(t => {
      if (t.status !== 'done') return false
      const completedDate = new Date(t.updated_at || t.created_at)
      return completedDate >= weekAgo
    }).length
  }

  const quickWins = tasks.filter(t => 
    t.effort && t.effort.includes('m') && parseInt(t.effort) <= 5
  ).length

  const streak = calculateStreak()
  const completedThisWeek = calculateWeeklyCompleted()

  // Top 5 unscheduled tasks
  const top5Tasks = isFrenzyMode
    ? (() => {
        const frenzyTasks = tasks.filter(t => {
          if (t.status !== 'pending' || t.scheduled_date) return false
          // Check if effort is 5min or less
          const effort = t.effort?.toLowerCase().trim() || ''
          console.log('Task:', t.title, 'Effort:', effort)
          // Match: 5m, 1m, 2m (5 minutes or less)
          const isQuickWin = effort === '5m' || effort === '1m' || effort === '2m'
          console.log('Is quick win?', isQuickWin)
          return isQuickWin
        })
        console.log('Total frenzy tasks found:', frenzyTasks.length)
        return frenzyTasks
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .slice(0, 5)
      })()
    : tasks
        .filter(t => t.status === 'pending' && !t.scheduled_date)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 5)

  async function handleTaskComplete(taskId: string) {
    setCompletingTaskId(taskId)
    await supabase
      .from('tasks')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', taskId)
    
    await loadUserData(user.id, false)
    setCompletingTaskId(null)
  }

  async function handleTaskSchedule(taskId: string) {
    setSelectedTask(tasks.find(t => t.id === taskId) || null)
    setScheduleModalOpen(true)
  }

  async function handleScheduleConfirm(date: string, time: string) {
    if (!selectedTask || !googleAccessToken) return
    
    try {
      // Combine date and time
      const dateTime = new Date(`${date}T${time}`)
      
      // Add to Google Calendar
      const event = {
        summary: selectedTask.title,
        start: { dateTime: dateTime.toISOString() },
        end: { 
          dateTime: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString() 
        },
      }

      let response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      // If token expired (401), try refreshing and retry once
      if (response.status === 401) {
        console.log('Access token expired, refreshing...')
        const newToken = await refreshGoogleToken()
        
        if (newToken) {
          response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          )
        }
      }

      if (!response.ok) throw new Error('Failed to create calendar event')

      // Update task in database
      await supabase
        .from('tasks')
        .update({ scheduled_date: dateTime.toISOString(), status: 'scheduled' })
        .eq('id', selectedTask.id)

      await loadUserData(user.id, false)
      setScheduleModalOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error scheduling task:', error)
      alert('Failed to schedule task. Please try reconnecting Google Calendar.')
    }
  }

  async function handleTaskUnschedule(taskId: string) {
    setUnschedulingTaskId(taskId)
    await supabase
      .from('tasks')
      .update({ scheduled_date: null, status: 'pending' })
      .eq('id', taskId)
    
    await loadUserData(user.id, false)
    setUnschedulingTaskId(null)
  }

  async function handleTaskDelete(taskId: string) {
    setDeletingTaskId(taskId)
    await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    await loadUserData(user.id, false)
    setDeletingTaskId(null)
  }

  async function handleTaskPriorityUpdate(taskId: string, newPriority: number) {
    await supabase
      .from('tasks')
      .update({ priority: newPriority })
      .eq('id', taskId)
    
    await loadUserData(user.id, false)
  }

  async function handleTaskSkip(taskId: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    await supabase
      .from('tasks')
      .update({ priority: Math.max(0, (task.priority || 0) - 10) })
      .eq('id', taskId)

    await loadUserData(user.id, false)
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  function handleAddCategory() {
    setEditingCategory(null)
    setCategoryModalOpen(true)
  }

  async function handleBrainDump(dumpText: string) {
    if (!user || !dumpText.trim()) return

    try {
      const response = await fetch('/api/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dumpText,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process brain dump')
      }

      await loadUserData(user.id, false)
      setShowBrainDumpModal(false)
    } catch (error) {
      console.error('Brain dump error:', error)
      alert('Failed to process brain dump. Please try again.')
    }
  }

  async function handleOnboardingComplete(data: {
    quarterGoals: string
    yearGoals: string
    categories: Array<Partial<Category>>
  }) {
    if (!user) return

    console.log('=== ONBOARDING START ===')
    console.log('User ID:', user.id)
    console.log('Quarter Goals:', data.quarterGoals)
    console.log('Year Goals:', data.yearGoals)

    try {
      // First, clean up any duplicate goals for this user
      const { data: allGoals, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      console.log('All goals found:', allGoals?.length)
      console.log('Fetch error:', fetchError)

      if (allGoals && allGoals.length > 1) {
        // Keep the first one, delete the rest
        console.log('CLEANING UP duplicates...')
        const idsToDelete = allGoals.slice(1).map(g => g.id)
        await supabase.from('goals').delete().in('id', idsToDelete)
        console.log('Deleted', idsToDelete.length, 'duplicate goals')
      }

      const existingGoals = allGoals && allGoals.length > 0 ? allGoals[0] : null

      if (existingGoals) {
        // Update existing
        console.log('UPDATING existing goals...')
        const { data: updateData, error: updateError } = await supabase
          .from('goals')
          .update({
            quarter_goals: data.quarterGoals,
            year_goals: data.yearGoals,
          })
          .eq('id', existingGoals.id)
          .select()

        console.log('Update result:', updateData)
        console.log('Update error:', updateError)

        if (updateError) {
          console.error('Error updating goals:', updateError)
          alert('Failed to save goals: ' + updateError.message)
          return
        }
      } else {
        // Insert new
        console.log('INSERTING new goals...')
        const { data: insertData, error: insertError } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            quarter_goals: data.quarterGoals,
            year_goals: data.yearGoals,
          })
          .select()

        console.log('Insert result:', insertData)
        console.log('Insert error:', insertError)

        if (insertError) {
          console.error('Error inserting goals:', insertError)
          alert('Failed to save goals: ' + insertError.message)
          return
        }
      }

      // Save categories - only if user has no categories yet
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      console.log('Existing categories:', existingCategories)

      if (!existingCategories || existingCategories.length === 0) {
        console.log('INSERTING categories...')
        for (const category of data.categories) {
          const { error: categoryError } = await supabase.from('categories').insert({
            ...category,
            user_id: user.id,
          })
          
          if (categoryError) {
            console.error('Error saving category:', categoryError)
          }
        }
      }
      
      console.log('RELOADING user data...')
      await loadUserData(user.id, false)
      console.log('=== ONBOARDING COMPLETE ===')
      setShowOnboarding(false)
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to complete onboarding: ' + error)
    }
  }

  async function handleCategorySave(data: Partial<Category>) {
    if (!user) return

    console.log('Saving category with data:', data)

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', editingCategory.id)
      
      if (error) {
        console.error('Error updating category:', error)
        alert('Failed to save category: ' + error.message)
        return
      }
    } else {
      // Create new category
      const { error } = await supabase
        .from('categories')
        .insert({
          ...data,
          user_id: user.id,
        })
      
      if (error) {
        console.error('Error creating category:', error)
        alert('Failed to create category: ' + error.message)
        return
      }
    }

    await loadUserData(user.id, false)
    setCategoryModalOpen(false)
    setEditingCategory(null)
  }

  function handleConnectGoogleCalendar() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID'
    const redirectUri = `${window.location.origin}/api/google-auth`
    const scope = 'https://www.googleapis.com/auth/calendar.events'
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent',
    })}`
    
    window.location.href = authUrl
  }

  // Landing page for non-logged-in users
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo/Icon */}
          <div className="space-y-4">
            <div className="text-6xl">🧠</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
              Brain Dump
            </h1>
            <p className="text-gray-400 text-lg">
              Capture thoughts. Prioritize tasks. Get things done.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-semibold text-[#00ff9d]">Top 5 Priority</h3>
                <p className="text-sm text-gray-400">Focus on what matters most</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-semibold text-[#00ff9d]">Frenzy Mode</h3>
                <p className="text-sm text-gray-400">Quick wins for busy moments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-[#00ff9d]">Track Progress</h3>
                <p className="text-sm text-gray-400">Build streaks and stay motivated</p>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            className="w-full bg-white text-[#0a0e27] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Stats Bar */}
        {!loading && (
        <div className="p-4">
          <StatsBar
            streak={streak}
            completedThisWeek={completedThisWeek}
            quickWins={quickWins}
            onViewCompleted={() => setShowCompletedModal(true)}
          />
        </div>
        )}

        {/* Content */}
        <div className="px-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 bg-[#1a1f3a] rounded-lg animate-pulse w-48"></div>
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-[#1a1f3a] rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
          {currentPage === 'home' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                  🎯 Top 5
                </h2>
                
                {/* Mode Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setIsFrenzyMode(!isFrenzyMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      isFrenzyMode 
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-[#0a0e27]'
                        : 'bg-[#1a1f3a] border border-[#2d3748] text-white hover:border-[#00ff9d]'
                    }`}
                  >
                    {isFrenzyMode ? (
                      <>
                        <span>⚡</span>
                        <span>Frenzy</span>
                      </>
                    ) : (
                      <>
                        <span>Priority</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isFrenzyMode && (
                <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-sm text-orange-300">
                    ⚡ <span className="font-bold">Frenzy Mode:</span> Quick wins only (5min or less)
                  </p>
                </div>
              )}
              
              {top5Tasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="mb-4">No tasks yet!</p>
                  <p className="text-sm">Click the 🧠 button below to add some.</p>
                </div>
              )}

              {top5Tasks.map((task, index) => {
                const category = categories.find(c => c.id === task.category_id)
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    category={category}
                    index={index}
                    onComplete={() => handleTaskComplete(task.id)}
                    onSchedule={() => handleTaskSchedule(task.id)}
                    onDelete={() => handleTaskDelete(task.id)}
                    onCardClick={() => setSelectedTaskForDetail(task)}
                    isDeleting={deletingTaskId === task.id}
                    isCompleting={completingTaskId === task.id}
                  />
                )
              })}
            </div>
          )}

          {currentPage === 'categories' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                  ✓ All To-dos
                </h2>
              </div>

              <div className="space-y-4">
                {categories.map(category => (
                  <CategoryColumn
                    key={category.id}
                    category={category}
                    tasks={tasks.filter(t => t.category_id === category.id)}
                    onEdit={() => handleEditCategory(category)}
                    onComplete={handleTaskComplete}
                    onUnschedule={handleTaskUnschedule}
                    onDelete={handleTaskDelete}
                    onTaskClick={(task) => setSelectedTaskForDetail(task)}
                    completingTaskId={completingTaskId}
                    unschedulingTaskId={unschedulingTaskId}
                    deletingTaskId={deletingTaskId}
                  />
                ))}
              </div>
            </div>
          )}

          {currentPage === 'stats' && (
            <StatsPage
              streak={streak}
              completedThisWeek={completedThisWeek}
              quickWins={quickWins}
              tasks={tasks}
              categories={categories}
            />
          )}

          {currentPage === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Settings</h2>
              
              {/* Profile Section */}
              <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                  👤 Profile
                </h3>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-[#0a0e27]">
                        {user?.email?.[0].toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {user?.email || 'No email'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tasks.filter(t => t.status === 'done').length} tasks completed
                    </div>
                  </div>
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      window.location.reload()
                    }}
                    className="bg-transparent border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
              
              {/* Google Calendar Connection */}
              <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                  📅 Google Calendar
                </h3>
                {googleAccessToken ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#00ff9d]">✓ Connected</span>
                    <button
                      onClick={() => {
                        setGoogleAccessToken(null)
                        localStorage.removeItem('google_access_token')
                      }}
                      className="text-sm text-gray-400 underline"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGoogleCalendar}
                    className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-3 rounded-xl font-bold"
                  >
                    Connect Google Calendar
                  </button>
                )}
              </div>

              {/* Goals */}
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
                      className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:outline-none focus:border-[#00ff9d]"
                      rows={2}
                      value={goals?.quarter_goals || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        setGoals({ ...goals!, quarter_goals: newValue })
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                      Year Goals
                    </label>
                    <textarea
                      className="w-full bg-[#0a0e27] border-2 border-[#2d3748] rounded-lg p-3 text-white focus:outline-none focus:border-[#00ff9d]"
                      rows={2}
                      value={goals?.year_goals || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        setGoals({ ...goals!, year_goals: newValue })
                      }}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (goals?.id) {
                        const { error } = await supabase.from('goals').update({ 
                          quarter_goals: goals.quarter_goals || '',
                          year_goals: goals.year_goals || ''
                        }).eq('user_id', user.id)
                        
                        if (error) {
                          alert('Failed to save goals: ' + error.message)
                        } else {
                          alert('Goals saved!')
                        }
                      }
                    }}
                    className="w-full bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-[#0a0e27] px-6 py-3 rounded-xl font-bold"
                  >
                    Save Goals
                  </button>
                </div>
              </div>

              {/* Categories Management */}
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
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="text-[#00ff9d] text-sm underline"
                            >
                              Edit
                            </button>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-400 mb-2">{category.description}</p>
                          )}
                          {category.goals && (
                            <p className="text-sm text-gray-500">🎯 {category.goals}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddCategory}
                  className="w-full mt-4 bg-[#2d3748] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#3d4758]"
                >
                  + Add Category
                </button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onBrainDump={() => setShowBrainDumpModal(true)}
      />

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false)
          setSelectedTask(null)
        }}
        onConfirm={handleScheduleConfirm}
        task={selectedTask}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false)
          setEditingCategory(null)
        }}
        category={editingCategory}
        onSave={handleCategorySave}
      />

      <BrainDumpModal
        isOpen={showBrainDumpModal}
        onClose={() => setShowBrainDumpModal(false)}
        onSubmit={handleBrainDump}
      />

      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          category={categories.find(c => c.id === selectedTaskForDetail.category_id)}
          isOpen={true}
          onClose={() => setSelectedTaskForDetail(null)}
          onComplete={handleTaskComplete}
          onUpdatePriority={handleTaskPriorityUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Completed Tasks This Week Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowCompletedModal(false)}>
          <div className="bg-[#1a1f3a] border border-[#2d3748] rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] bg-clip-text text-transparent">
                ✓ Completed This Week
              </h2>
              <button
                onClick={() => setShowCompletedModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-2">
              {tasks.filter(t => {
                if (t.status !== 'done') return false
                const completedDate = new Date(t.updated_at || t.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return completedDate >= weekAgo
              }).map(task => {
                const category = categories.find(c => c.id === task.category_id)
                const completedDate = new Date(task.updated_at || task.created_at)
                return (
                  <div key={task.id} className="bg-[#0a0e27] border border-[#2d3748] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{task.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {category && (
                            <span style={{ color: category.color }}>{category.name}</span>
                          )}
                          <span>•</span>
                          <span>{completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="text-[#00ff9d] text-xl">✓</div>
                    </div>
                  </div>
                )
              })}
              {tasks.filter(t => {
                if (t.status !== 'done') return false
                const completedDate = new Date(t.updated_at || t.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return completedDate >= weekAgo
              }).length === 0 && (
                <p className="text-center text-gray-400 py-8">No completed tasks this week yet!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
