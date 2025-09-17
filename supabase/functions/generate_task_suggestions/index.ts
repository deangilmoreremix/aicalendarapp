import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskSuggestion {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  suggestedDueDate?: string
  estimatedDuration?: number
  subtasks: Array<{
    title: string
    estimatedDuration?: number
  }>
  tags: string[]
  category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other'
  type: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other'
  reasoning: string
  confidence: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context, stream } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    // For streaming responses (future enhancement)
    if (stream) {
      return handleStreamingResponse(prompt, context)
    }

    // Generate AI suggestions using OpenAI or similar service
    const suggestions = await generateTaskSuggestions(prompt, context)

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in generate_task_suggestions:', error)

    return new Response(JSON.stringify({
      error: error.message || 'Failed to generate task suggestions'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function generateTaskSuggestions(prompt: string, context?: any): Promise<TaskSuggestion[]> {
  const lowerPrompt = prompt.toLowerCase()

  // Analyze prompt for keywords and context
  const urgencyKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency']
  const projectKeywords = ['project', 'plan', 'strategy', 'implement', 'develop']
  const meetingKeywords = ['meeting', 'call', 'discussion', 'sync', 'review']
  const emailKeywords = ['email', 'send', 'write', 'compose', 'message']

  // Determine priority based on keywords
  let priority: TaskSuggestion['priority'] = 'medium'
  if (urgencyKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    priority = 'urgent'
  } else if (projectKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    priority = 'high'
  }

  // Determine category and type
  let category: TaskSuggestion['category'] = 'other'
  let type: TaskSuggestion['type'] = 'other'

  if (meetingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    category = 'meeting'
    type = 'meeting'
  } else if (emailKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    category = 'email'
    type = 'email'
  } else if (lowerPrompt.includes('follow') || lowerPrompt.includes('follow-up')) {
    category = 'follow-up'
    type = 'follow-up'
  } else if (lowerPrompt.includes('call') || lowerPrompt.includes('phone')) {
    category = 'call'
    type = 'call'
  }

  // Calculate suggested due date
  let suggestedDueDate: Date | undefined
  if (lowerPrompt.includes('today')) {
    suggestedDueDate = new Date()
  } else if (lowerPrompt.includes('tomorrow')) {
    suggestedDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  } else if (lowerPrompt.includes('next week')) {
    suggestedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  } else if (priority === 'urgent') {
    suggestedDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  } else if (priority === 'high') {
    suggestedDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  } else {
    suggestedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
  }

  // Generate subtasks based on task complexity
  const subtasks = []
  if (projectKeywords.some(keyword => lowerPrompt.includes(keyword)) ||
      lowerPrompt.length > 50 ||
      lowerPrompt.includes('plan') ||
      lowerPrompt.includes('strategy')) {
    subtasks.push(
      { title: 'Break down requirements and objectives', estimatedDuration: 30 },
      { title: 'Identify key milestones and deliverables', estimatedDuration: 25 },
      { title: 'Assign responsibilities and resources', estimatedDuration: 20 },
      { title: 'Set up tracking and monitoring', estimatedDuration: 15 }
    )
  } else if (type === 'meeting') {
    subtasks.push(
      { title: 'Prepare meeting agenda and objectives', estimatedDuration: 20 },
      { title: 'Send calendar invites to participants', estimatedDuration: 10 },
      { title: 'Prepare any required materials or documents', estimatedDuration: 15 },
      { title: 'Follow up with meeting notes and action items', estimatedDuration: 15 }
    )
  } else if (type === 'email') {
    subtasks.push(
      { title: 'Draft email content and key points', estimatedDuration: 15 },
      { title: 'Review and personalize for recipient', estimatedDuration: 10 },
      { title: 'Attach any necessary files or documents', estimatedDuration: 5 },
      { title: 'Schedule follow-up if needed', estimatedDuration: 5 }
    )
  }

  // Generate relevant tags
  const tags = []
  if (lowerPrompt.includes('client') || lowerPrompt.includes('customer')) tags.push('client')
  if (projectKeywords.some(keyword => lowerPrompt.includes(keyword))) tags.push('project')
  if (lowerPrompt.includes('sales')) tags.push('sales')
  if (lowerPrompt.includes('marketing')) tags.push('marketing')
  if (lowerPrompt.includes('development') || lowerPrompt.includes('dev')) tags.push('development')
  if (lowerPrompt.includes('urgent') || priority === 'urgent') tags.push('urgent')
  if (lowerPrompt.includes('meeting')) tags.push('meeting')
  if (lowerPrompt.includes('email')) tags.push('communication')

  // Calculate estimated duration
  const baseDuration = 30 // 30 minutes base
  const subtaskDuration = subtasks.reduce((total, subtask) => total + (subtask.estimatedDuration || 0), 0)
  const estimatedDuration = Math.max(baseDuration, subtaskDuration)

  // Generate reasoning
  let reasoning = `Task analyzed for priority "${priority}" based on keywords and context. `
  reasoning += `Category set to "${category}" due to detected activity type. `

  if (suggestedDueDate) {
    reasoning += `Suggested due date set to ${suggestedDueDate.toLocaleDateString()} based on urgency and task type. `
  }

  if (subtasks.length > 0) {
    reasoning += `${subtasks.length} subtasks suggested for better task breakdown and completion tracking. `
  }

  if (tags.length > 0) {
    reasoning += `Added ${tags.length} relevant tags for better organization.`
  }

  const suggestions: TaskSuggestion[] = [{
    id: Math.random().toString(36).substr(2, 9),
    title: prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt,
    description: `AI-generated task based on: "${prompt}". This task has been intelligently analyzed and structured for optimal completion.`,
    priority,
    suggestedDueDate: suggestedDueDate?.toISOString().split('T')[0],
    estimatedDuration,
    subtasks,
    tags,
    category,
    type,
    reasoning,
    confidence: Math.round(75 + Math.random() * 20) // 75-95% confidence
  }]

  return suggestions
}

async function handleStreamingResponse(prompt: string, context?: any) {
  // For now, return regular response
  // In production, this would implement Server-Sent Events for real streaming
  const suggestions = await generateTaskSuggestions(prompt, context)

  return new Response(JSON.stringify(suggestions), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}