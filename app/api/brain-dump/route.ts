import { NextRequest, NextResponse } from 'next/server'
import { processBrainDump } from '@/lib/claude'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dumpText, userId } = body

    if (!dumpText || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch user's categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Fetch user's goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (goalsError && goalsError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching goals:', goalsError)
    }

    const quarterGoals = goalsData?.quarter_goals || 'No quarterly goals set'
    const yearGoals = goalsData?.year_goals || 'No yearly goals set'

    // Process brain dump with Claude
    const result = await processBrainDump(
      dumpText,
      categories || [],
      quarterGoals,
      yearGoals
    )

    // Insert tasks into database
    const tasksToInsert = result.tasks.map((task) => {
      const category = categories?.find((c) => c.name === task.category)
      return {
        user_id: userId,
        category_id: category?.id || null,
        title: task.title,
        urgency: task.urgency,
        effort: task.effort,
        priority: task.priority,
        status: 'pending',
      }
    })

    if (tasksToInsert.length > 0) {
      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting tasks:', insertError)
        return NextResponse.json(
          { error: 'Failed to save tasks' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        tasks: insertedTasks,
        count: insertedTasks.length 
      })
    }

    return NextResponse.json({ tasks: [], count: 0 })
  } catch (error) {
    console.error('Brain dump processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
