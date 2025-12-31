import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type BrainDumpResult = {
  tasks: Array<{
    title: string
    category: string
    urgency: 'high' | 'medium' | 'low'
    effort: string
    priority: number
  }>
}

export async function processBrainDump(
  dumpText: string,
  categories: Array<{ name: string; description: string; goals: string; priority: number; time_allocation: string }>,
  quarterGoals: string,
  yearGoals: string
): Promise<BrainDumpResult> {
  const categoriesContext = categories
    .map(
      (cat) =>
        `- ${cat.name} (Priority #${cat.priority}): ${cat.description}. Goals: ${cat.goals}. Time: ${cat.time_allocation}`
    )
    .join('\n')

  const prompt = `You are a smart task management AI. The user has dumped their thoughts and you need to extract tasks, categorize them, and prioritize them.

User's Categories:
${categoriesContext}

User's Quarterly Goals:
${quarterGoals}

User's Yearly Goals:
${yearGoals}

User's Brain Dump:
${dumpText}

Extract individual tasks from the brain dump. For each task:
1. Identify the task clearly
2. Assign it to the most appropriate category
3. Determine urgency (high/medium/low) based on deadlines, importance, and alignment with goals
4. Estimate effort (e.g., "5m", "30m", "2h", "1d")
5. Calculate a priority score (0-100) based on:
   - Category priority (higher category priority = higher task priority)
   - Urgency
   - Alignment with quarterly/yearly goals
   - Effort (quick wins get a boost)

Return ONLY a valid JSON object with this structure:
{
  "tasks": [
    {
      "title": "Task description",
      "category": "Category Name",
      "urgency": "high|medium|low",
      "effort": "estimated time",
      "priority": 85
    }
  ]
}

If no tasks are found, return {"tasks": []}.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
  
  // Clean up response - remove markdown code blocks if present
  const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    const result = JSON.parse(cleanedResponse)
    return result
  } catch (error) {
    console.error('Failed to parse Claude response:', cleanedResponse, error)
    return { tasks: [] }
  }
}
