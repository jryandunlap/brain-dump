import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = {
  id: string
  user_id: string
  name: string
  color: string
  description: string | null
  goals: string | null
  time_allocation: string | null
  priority: number
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  urgency: 'high' | 'medium' | 'low'
  effort: string | null
  priority: number
  status: 'pending' | 'scheduled' | 'done'
  scheduled_date: string | null
  google_calendar_event_id: string | null
  created_at: string
  updated_at: string
}

export type Goals = {
  id: string
  user_id: string
  quarter_goals: string | null
  year_goals: string | null
  created_at: string
  updated_at: string
}
