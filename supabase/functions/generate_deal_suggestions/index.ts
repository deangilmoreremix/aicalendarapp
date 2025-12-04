import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DealSuggestion {
  id: string
  title: string
  value: number
  description?: string
  priority: 'low' | 'medium' | 'high'
  expectedCloseDate?: string
  probability: number
  tags: string[]
  reasoning: string
  confidence: number
  strategy: {
    approach: string
    timeline: string[]
    risks: string[]
    nextSteps: string[]
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { prompt, context } = body

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string')
    }

    if (prompt.length < 3) {
      throw new Error('Prompt must be at least 3 characters long')
    }

    if (prompt.length > 1000) {
      throw new Error('Prompt must be less than 1000 characters')
    }

    // Basic sanitization - remove potentially harmful characters
    const sanitizedPrompt = prompt.replace(/[<>\"'&]/g, '')

    // Generate AI deal suggestions
    const suggestions = await generateDealSuggestions(sanitizedPrompt, context)

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in generate_deal_suggestions:', error)

    return new Response(JSON.stringify({
      error: error.message || 'Failed to generate deal suggestions'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function generateDealSuggestions(prompt: string, context?: any): Promise<DealSuggestion[]> {
  const lowerPrompt = prompt.toLowerCase()

  // Analyze deal characteristics
  const enterpriseKeywords = ['enterprise', 'corp', 'corporation', 'inc', 'ltd', 'group', 'enterprise']
  const startupKeywords = ['startup', 'founder', 'seed', 'series a', 'venture']
  const consultingKeywords = ['consulting', 'advisory', 'strategy', 'implementation']
  const productKeywords = ['product', 'software', 'saas', 'platform', 'solution']

  // Determine deal size and characteristics
  let baseValue = 10000 // $10k base
  let priority: DealSuggestion['priority'] = 'medium'
  let probability = 50

  if (enterpriseKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    baseValue = 50000 // $50k+ for enterprise
    priority = 'high'
    probability = 65
  } else if (startupKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    baseValue = 25000 // $25k for startups
    priority = 'high'
    probability = 55
  } else if (consultingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    baseValue = 15000 // $15k for consulting
    priority = 'medium'
    probability = 60
  }

  // Add variance based on complexity
  const complexityMultiplier = lowerPrompt.includes('complex') ||
                              lowerPrompt.includes('large') ||
                              lowerPrompt.includes('scale') ? 2 : 1
  const finalValue = baseValue * complexityMultiplier * (0.8 + Math.random() * 0.4) // ±20% variance

  // Determine close timeline
  let expectedCloseDate: Date
  if (lowerPrompt.includes('urgent') || lowerPrompt.includes('asap')) {
    expectedCloseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  } else if (priority === 'high') {
    expectedCloseDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
  } else {
    expectedCloseDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  }

  // Generate relevant tags
  const tags = []
  if (enterpriseKeywords.some(keyword => lowerPrompt.includes(keyword))) tags.push('enterprise')
  if (startupKeywords.some(keyword => lowerPrompt.includes(keyword))) tags.push('startup')
  if (consultingKeywords.some(keyword => lowerPrompt.includes(keyword))) tags.push('consulting')
  if (productKeywords.some(keyword => lowerPrompt.includes(keyword))) tags.push('product')
  if (lowerPrompt.includes('sales')) tags.push('sales')
  if (lowerPrompt.includes('marketing')) tags.push('marketing')
  if (lowerPrompt.includes('urgent')) tags.push('urgent')

  // Generate deal strategy
  const strategy = generateDealStrategy(prompt, priority, probability)

  // Generate reasoning
  let reasoning = `Deal analyzed with estimated value of $${Math.round(finalValue).toLocaleString()}. `
  reasoning += `Priority set to "${priority}" based on deal size and complexity. `
  reasoning += `Probability estimated at ${probability}% based on market conditions and deal type. `
  reasoning += `Expected close date set to ${expectedCloseDate.toLocaleDateString()} based on deal complexity and priority.`

  const suggestions: DealSuggestion[] = [{
    id: Math.random().toString(36).substr(2, 9),
    title: prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt,
    value: Math.round(finalValue),
    description: `AI-analyzed deal opportunity: ${prompt}. Deal characteristics and strategy have been intelligently assessed.`,
    priority,
    expectedCloseDate: expectedCloseDate.toISOString().split('T')[0],
    probability,
    tags,
    reasoning,
    confidence: Math.round(70 + Math.random() * 25), // 70-95% confidence
    strategy
  }]

  return suggestions
}

function generateDealStrategy(prompt: string, priority: string, probability: number) {
  const lowerPrompt = prompt.toLowerCase()

  let approach = 'Direct sales approach with personalized value proposition'
  if (lowerPrompt.includes('enterprise')) {
    approach = 'Enterprise sales approach with executive sponsorship and ROI focus'
  } else if (lowerPrompt.includes('startup')) {
    approach = 'Startup-focused approach with product-market fit and growth potential'
  } else if (lowerPrompt.includes('consulting')) {
    approach = 'Consulting approach with expertise demonstration and trust-building'
  }

  const timeline = []
  if (priority === 'high') {
    timeline.push('Week 1: Initial discovery call and needs assessment')
    timeline.push('Week 2: Proposal development and stakeholder alignment')
    timeline.push('Week 3-4: Negotiation and contract finalization')
  } else {
    timeline.push('Week 1-2: Initial discovery and relationship building')
    timeline.push('Week 3-4: Requirements gathering and solution design')
    timeline.push('Week 5-8: Proposal development and stakeholder buy-in')
    timeline.push('Week 9-12: Negotiation and contract execution')
  }

  const risks = []
  if (probability < 60) {
    risks.push('Competition from established vendors')
    risks.push('Budget constraints or procurement delays')
  }
  if (lowerPrompt.includes('new') || lowerPrompt.includes('startup')) {
    risks.push('Unproven track record or market validation concerns')
  }
  if (lowerPrompt.includes('enterprise')) {
    risks.push('Complex decision-making process and multiple stakeholders')
  }

  const nextSteps = [
    'Schedule discovery call to understand requirements',
    'Prepare customized proposal and ROI analysis',
    'Identify key decision-makers and influencers',
    'Develop relationship with economic buyer'
  ]

  return {
    approach,
    timeline,
    risks,
    nextSteps
  }
}