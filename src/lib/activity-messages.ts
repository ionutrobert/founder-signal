export const activityMessages: Record<string, string[]> = {
  research: [
    'Analyzing market trends...',
    'Identifying growth signals...',
    'Researching competitors...',
    'Evaluating market timing...',
    'Processing industry dynamics...',
  ],
  problemClarity: [
    'Defining problem statement...',
    'Analyzing severity level...',
    'Gathering evidence...',
    'Assessing confidence level...',
  ],
  targetAudience: [
    'Identifying ideal customer profile...',
    'Mapping key segments...',
    'Building personas...',
  ],
  marketInsight: [
    'Calculating market size...',
    'Analyzing TAM, SAM, SOM...',
    'Identifying market trends...',
    'Processing growth signals...',
  ],
  competition: [
    'Identifying direct competitors...',
    'Analyzing indirect alternatives...',
    'Evaluating competitive advantage...',
    'Processing competitor strengths...',
  ],
  positioning: [
    'Defining unique value proposition...',
    'Identifying differentiators...',
    'Building messaging pillars...',
    'Crafting brand promise...',
  ],
  mvpScope: [
    'Defining core features...',
    'Setting success metrics...',
    'Planning timeline...',
    'Identifying resource needs...',
  ],
  monetization: [
    'Analyzing revenue model...',
    'Evaluating pricing strategy...',
    'Identifying sales channels...',
    'Processing projections...',
  ],
  risks: [
    'Identifying technical risks...',
    'Analyzing market risks...',
    'Evaluating operational constraints...',
    'Processing regulatory risks...',
  ],
}

export function getActivityMessages(section: string): string[] {
  return activityMessages[section] || ['Processing...']
}
