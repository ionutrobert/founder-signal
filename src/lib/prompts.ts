const systemPrompt = `You are a senior startup validator with expertise in Lean Startup, JTBD, Lean Canvas, Unit Economics, TAM/SAM/SOM, competitive analysis, MVP scoping, SaaS business models, and go-to-market strategy.

EVALUATION CRITERIA:
- Problem severity: "hair on fire" or "nice to have"?
- Market timing: Why now? What changed?
- Differentiation: Why can't incumbents copy this?
- Business model viability: Can this make money?
- Execution risk: What could kill this?`

const validationPrompt = `
You are a startup idea validator for Founder Signal. Produce a deterministic evaluation.

IDEA: {idea}

Respond with a single JSON object:
{
  "ideaSummary": { "title": string, "oneLiner": string, "category": string, "problemTheme": string, "tractionEvidence": string[], "summary": string },
  "whyNow": { "timing": string, "marketForces": string[], "enablingTechnology": string[], "culturalShift": string[], "summary": string },
  "problemClarity": { "problemStatement": string, "severity": "critical"|"moderate"|"low", "affectedUsers": string, "evidence": string[], "confidenceLevel": string, "summary": string },
  "targetAudience": { "icp": string, "keySegments": string[], "personas": [{ "name": string, "description": string, "painPoints": string[], "goals": string[] }], "summary": string },
  "marketInsight": { "tam": string, "sam": string, "som": string, "trends": string[], "growthSignals": string[], "marketGrowthRate": string, "marketMaturity": "emerging"|"growing"|"mature"|"declining", "keyMetrics": [{"name": string, "value": string, "trend": "up"|"down"|"stable"}], "summary": string },
  "competition": { "directCompetitors": [{ "name": string, "strengths": string[], "weaknesses": string[], "positioningNotes": string }], "indirectCompetitors": [{ "name": string, "strengths": string[], "weaknesses": string[], "positioningNotes": string }], "competitiveAdvantage": string, "marketShareEstimate": string, "competitiveIntensity": "low"|"medium"|"high", "summary": string },
  "positioning": { "uniqueValueProposition": string, "differentiators": string[], "messagingPillars": string[], "brandPromise": string, "summary": string },
  "mvpScope": { "coreFeatures": string[], "timeline": string, "successMetrics": string[], "resourceNeeds": string[], "deferredCapabilities": string[], "summary": string },
  "monetization": { "revenueModel": string, "pricingStrategy": string, "salesChannels": string[], "projections": string, "keyAssumptions": string[], "summary": string },
  "risks": { "technical": string[], "market": string[], "operational": string[], "regulatory": string[], "summary": string },
  "score": number,
  "verdict": "pass"|"fail"|"needs-work"
}

Rules:
- Use bullet points for every list. Begin each with "- ".
- Keep strings deterministic and grounded in the idea.
- Each section MUST include "summary": 1-2 sentences.
- Score: integer 0-100. Weights: whyNow 10%, problemClarity 25%, marketInsight 25%, competition 20%, traction 10%, risk 10%.
- Verdict: "pass" >= 80, "needs-work" 60-79, "fail" < 60.
- Do not emit any text outside the JSON object.
`

const scoringPrompt = `
SCORING METHODOLOGY
- Score is an integer between 0 and 100 that reflects a weighted assessment of the idea.
- Apply the following weights consistently: whyNow 10%, problemClarity 25%, marketInsight 25%, competition 20%, traction/team indicators (ideaSummary.tractionEvidence) 10%, execution risk (risks arrays) 10%.
- Record how each dimension contributes inside its respective section using bullet points.
- Round the weighted average to the nearest whole number; do not include decimals in the score field.

VERDICT CRITERIA
- Use "pass" when the final score is 80 or above.
- Use "needs-work" when the score is between 60 and 79 inclusive.
- Use "fail" when the score is below 60.
- Ensure the verdict string mirrors the numeric score and references confidenceLevel, tractionEvidence, or risk signal bullets when explaining the decision.
- Keep the verdict inside the top-level "verdict" field and nowhere else.

TYPE GUIDANCE
- The Score type is the numeric 0-100 value, and Verdict accepts only "pass", "needs-work", or "fail".
- Always keep the verdict consistent with the computed score and the documented evidence.

WHY NOW SCORING (0-100):
- 80-100: Perfect timing - multiple converging forces (market, tech, culture) create unique window
- 65-79: Good timing - one strong timing indicator with supporting evidence
- 50-64: Adequate timing - some favorable conditions but not exceptional
- 35-49: Weak timing - timing is neutral or unclear, no strong catalysts
- 0-34: Bad timing - market not ready, technology immature, or cultural shift opposing
`

const mvpPrompt = `
MVP RECOMMENDATION RULES
- Follow the MVPScope definition from founder-signal/src/types/validation.ts for this section.
- coreFeatures: list the 3-5 highest-leverage capabilities required for launch, each as a bullet describing concrete functionality.
- timeline: state a deterministic schedule (weeks, sprints, or phases) that maps to the MVP deliverables and avoid vague adjectives.
- successMetrics: provide measurable KPIs (activation, completion, etc.) as bullet entries that validate the MVP.
- resourceNeeds: list the essential people, tools, or integrations required to deliver the MVP using bullet points.
- deferredCapabilities: capture enhancements that are intentionally postponed and describe why they wait.
- Keep the MVP focused on the scoring/verdict workflow and omit features that belong to later releases.

CONTEXT
- Mention how the coreFeatures and timeline connect to deterministic scoring and report delivery.
- Do not add new top-level sections beyond the ValidationReport schema.
`

const scoringInstructions = `
SCORING SCALE (0-100):
- 80-100: Excellent - strong evidence, clear problem, validated market
- 65-79: Good - solid foundation with minor gaps
- 50-64: Adequate - usable but needs refinement
- 35-49: Weak - significant issues require attention
- 0-34: Critical - fundamental problems undermine viability

Each section MUST include:
- "summary": 1-2 sentences capturing the key insight for that section
- "score": integer 0-100 based on the scale above
- "scoreReasoning": 1-2 sentences explaining the score

WHY NOW SCORING:
- 80-100: Perfect timing - multiple converging forces (market, tech, culture) create unique window
- 65-79: Good timing - one strong timing indicator with supporting evidence
- 50-64: Adequate timing - some favorable conditions but not exceptional
- 35-49: Weak timing - timing is neutral or unclear, no strong catalysts
- 0-34: Bad timing - market not ready, technology immature, or cultural shift opposing
`

export function getValidationPrompt(idea: string): { system: string; user: string } {
  const ideaText = idea.trim()
  return {
    system: systemPrompt,
    user: [
      validationPrompt.replace('{idea}', ideaText),
      scoringPrompt,
      mvpPrompt,
    ].join('\n\n')
  }
}

export function getStreamingValidationPrompt(idea: string): { system: string; user: string } {
  const ideaText = idea.trim()
  return {
    system: systemPrompt,
    user: [streamingValidationPrompt.replace('{idea}', ideaText), scoringPrompt, mvpPrompt].join('\n\n')
  }
}

export function generateResearchPrompt(idea: string): { system: string; user: string } {
  const ideaText = idea.trim()
  return {
    system: systemPrompt,
    user: [researchPrompt.replace('${ideaText}', ideaText), scoringInstructions].join('\n\n')
  }
}

export function generateStructuralPrompt(idea: string, researchContext: string): { system: string; user: string } {
  const ideaText = idea.trim()
  return {
    system: systemPrompt,
    user: [structuralPrompt.replace('${ideaText}', ideaText).replace('${researchContext}', researchContext), scoringInstructions].join('\n\n')
  }
}

export function generateStrategicPrompt(idea: string, structuralContext: string): { system: string; user: string } {
  const ideaText = idea.trim()
  return {
    system: systemPrompt,
    user: [strategicPrompt.replace('${ideaText}', ideaText).replace('${structuralContext}', structuralContext), scoringInstructions, scoringPrompt, mvpPrompt].join('\n\n')
  }
}

export function validatePromptPhase(prompt: string, expectedPhase: 'research' | 'structural' | 'strategic'): boolean {
  const researchKeywords = ['market', 'trends', 'competitors', 'timing', 'dynamics'];
  const structuralKeywords = ['problem', 'audience', 'market', 'monetization', 'risks'];
  const strategicKeywords = ['positioning', 'competition', 'mvp', 'score', 'verdict'];
  const lowerPrompt = prompt.toLowerCase();
  switch (expectedPhase) {
    case 'research':
      return researchKeywords.some(k => lowerPrompt.includes(k)) && !structuralKeywords.some(k => lowerPrompt.includes(k)) && !strategicKeywords.some(k => lowerPrompt.includes(k));
    case 'structural':
      return structuralKeywords.some(k => lowerPrompt.includes(k)) && !strategicKeywords.some(k => lowerPrompt.includes(k));
    case 'strategic':
      return strategicKeywords.some(k => lowerPrompt.includes(k));
    default:
      return false;
  }
}
}

const streamingValidationPrompt = `
You are a startup idea validator for Founder Signal. Analyze the IDEA and output ONLY newline-delimited JSON.

IDEA: {idea}

Emit exactly 12 lines. Each line must be a single minified JSON object:
1. {"type":"section","name":"ideaSummary","data":{"title":string,"oneLiner":string,"category":string,"problemTheme":string,"tractionEvidence":string[],summary:string}}
2. {"type":"section","name":"whyNow","data":{"timing":string,"marketForces":string[],enablingTechnology:string[],culturalShift:string[],summary:string}}
3. {"type":"section","name":"problemClarity","data":{"problemStatement":string,"severity":"critical"|"moderate"|"low","affectedUsers":string,"evidence":string[],confidenceLevel:string,summary:string}}
4. {"type":"section","name":"targetAudience","data":{"icp":string,"keySegments":string[],personas:[{name:string,description:string,painPoints:string[],goals:string[]}],summary:string}}
5. {"type":"section","name":"marketInsight","data":{"tam":string,"sam":string,"som":string,"trends":string[],growthSignals:string[],marketGrowthRate:string,marketMaturity:string,keyMetrics:[{name:string,value:string,trend:string}],summary:string}}
6. {"type":"section","name":"competition","data":{"directCompetitors":[{name:string,strengths:string[],weaknesses:string[],positioningNotes:string}],"indirectCompetitors":[{name:string,strengths:string[],weaknesses:string[],positioningNotes:string}],competitiveAdvantage:string,marketShareEstimate:string,competitiveIntensity:string,summary:string}}
7. {"type":"section","name":"positioning","data":{"uniqueValueProposition":string,"differentiators":string[],"messagingPillars":string[],brandPromise:string,summary:string}}
8. {"type":"section","name":"mvpScope","data":{"coreFeatures":string[],timeline:string,successMetrics:string[],resourceNeeds:string[],deferredCapabilities:string[],summary:string}}
9. {"type":"section","name":"monetization","data":{"revenueModel":string,pricingStrategy:string,salesChannels:string[],projections:string,keyAssumptions:string[],summary:string}}
10. {"type":"section","name":"risks","data":{"technical":string[],market:string[],operational:string[],regulatory:string[],summary:string}}
11. {"type":"score","value":number}
12. {"type":"verdict","value":"pass"|"fail"|"needs-work"}

Rules:
- Every line must be valid JSON. No markdown, no commentary.
- Arrays must contain concise bullet strings.
- Each section must include summary.
- Score: integer 0-100. Weights: whyNow 10%, problemClarity 25%, marketInsight 25%, competition 20%, traction 10%, risk 10%.
- Verdict: pass >= 80, needs-work 60-79, fail < 60.
`

export function getStreamingValidationPrompt(idea: string): { system: string; user: string } {
  const ideaText = idea.trim()

  return {
    system: systemPrompt,
    user: [streamingValidationPrompt.replace('{idea}', ideaText), scoringPrompt, mvpPrompt].join('\n\n')
  }
}

export function generateResearchPrompt(idea: string): { system: string; user: string } {
const ideaText = idea.trim()

const researchPrompt = `
You are a market research specialist. Analyze the IDEA and provide market context.

IDEA: ${ideaText}

Focus on: market trends, growth signals, competitive landscape, market timing, industry dynamics.

Output JSON:
{
  "marketTrends": string[],
  "growthSignals": string[],
  "directCompetitors": string[],
  "indirectCompetitors": string[],
  "marketTiming": { "assessment": string, "score": number, "scoreReasoning": string },
  "industryDynamics": string[],
  "overallScore": number,
  "overallReasoning": string
}

Rules: Use bullet points for arrays. Be specific and data-driven. Include scores (0-100) with reasoning.
`

  return {
    system: systemPrompt,
    user: [researchPrompt, scoringInstructions].join('\n\n')
  }
}

export function generateStructuralPrompt(idea: string, researchContext: string): { system: string; user: string } {
  const ideaText = idea.trim()

  const structuralPrompt = `
You are a framework validation specialist. Analyze the IDEA using research context.

IDEA: ${ideaText}

RESEARCH CONTEXT:
${researchContext}

Evaluate: problem clarity, target audience, market size, business model, execution risk.

Output JSON:
{
  "problemClarity": { "problemStatement": string, "severity": "critical"|"moderate"|"low", "affectedUsers": string, "evidence": string[], "score": number, "scoreReasoning": string },
  "targetAudience": { "icp": string, "keySegments": string[], "personas": [{ "name": string, "description": string, "painPoints": string[], "goals": string[] }], "score": number, "scoreReasoning": string },
  "marketInsight": { "tam": string, "sam": string, "som": string, "trends": string[], "growthSignals": string[], "score": number, "scoreReasoning": string },
  "monetization": { "revenueModel": string, "pricingStrategy": string, "salesChannels": string[], "projections": string, "keyAssumptions": string[], "score": number, "scoreReasoning": string },
  "risks": { "technical": string[], "market": string[], "operational": string[], "regulatory": string[], "score": number, "scoreReasoning": string }
}

Rules: Use bullet points for arrays. Tie severity to evidence. Include scores (0-100) with reasoning.
`

  return {
    system: systemPrompt,
    user: [structuralPrompt, scoringInstructions].join('\n\n')
  }
}

export function generateStrategicPrompt(idea: string, structuralContext: string): { system: string; user: string } {
  const ideaText = idea.trim()

  const strategicPrompt = `
You are a strategic evaluation specialist. Provide final assessment.

IDEA: ${ideaText}

STRUCTURAL CONTEXT:
${structuralContext}

Evaluate: executive summary, competitive advantage, positioning, MVP scope, verdict.

Output JSON:
{
  "executiveSummary": { "plainEnglish": string, "keyTakeaways": string[], "actionItems": string[] },
  "ideaSummary": { "title": string, "oneLiner": string, "category": string, "problemTheme": string, "tractionEvidence": string[], "score": number, "scoreReasoning": string },
  "competition": { "directCompetitors": [{ "name": string, "strengths": string[], "weaknesses": string[], "positioningNotes": string }], "indirectCompetitors": [{ "name": string, "strengths": string[], "weaknesses": string[], "positioningNotes": string }], "competitiveAdvantage": string, "score": number, "scoreReasoning": string },
  "positioning": { "uniqueValueProposition": string, "differentiators": string[], "messagingPillars": string[], "brandPromise": string, "score": number, "scoreReasoning": string },
  "mvpScope": { "coreFeatures": string[], "timeline": string, "successMetrics": string[], "resourceNeeds": string[], "deferredCapabilities": string[], "score": number, "scoreReasoning": string },
  "score": number,
  "verdict": "pass"|"fail"|"needs-work"
}

Rules: Use bullet points for arrays. Score: integer 0-100. Verdict: pass >= 80, needs-work 60-79, fail < 60.
`

  return {
    system: systemPrompt,
    user: [strategicPrompt, scoringInstructions, scoringPrompt, mvpPrompt].join('\n\n')
  }
}

export function validatePromptPhase(prompt: string, expectedPhase: 'research' | 'structural' | 'strategic'): boolean {
  const researchKeywords = ['market', 'trends', 'competitors', 'timing', 'dynamics'];
  const structuralKeywords = ['problem', 'audience', 'market', 'monetization', 'risks'];
  const strategicKeywords = ['positioning', 'competition', 'mvp', 'score', 'verdict'];

  const lowerPrompt = prompt.toLowerCase();

  switch (expectedPhase) {
    case 'research':
      return researchKeywords.some(keyword => lowerPrompt.includes(keyword)) &&
             !structuralKeywords.some(keyword => lowerPrompt.includes(keyword)) &&
             !strategicKeywords.some(keyword => lowerPrompt.includes(keyword));
    case 'structural':
      return structuralKeywords.some(keyword => lowerPrompt.includes(keyword)) &&
             !strategicKeywords.some(keyword => lowerPrompt.includes(keyword));
    case 'strategic':
      return strategicKeywords.some(keyword => lowerPrompt.includes(keyword));
    default:
      return false;
  }
}
