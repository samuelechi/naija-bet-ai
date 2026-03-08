import Anthropic from '@anthropic-ai/sdk'
import { Match, Prediction, H2HResult, FormResult } from '@/types'

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

interface PredictionInput {
    match: Match
    homeForm: FormResult[]
    awayForm: FormResult[]
    h2h: H2HResult[]
}

export async function generatePrediction(input: PredictionInput): Promise<Prediction> {
    const { match, homeForm, awayForm, h2h } = input

    const h2hStr = h2h
        .map(g => `${g.date}: ${g.homeTeam} ${g.homeScore}-${g.awayScore} ${g.awayTeam} (${g.result})`)
        .join('\n') || 'No H2H data'

    const prompt = `Analyse this football match and return a JSON prediction.

MATCH: ${match.homeTeam.name} vs ${match.awayTeam.name}
COMPETITION: ${match.competition.name}
DATE: ${new Date(match.utcDate).toLocaleDateString('en-GB')}

RECENT FORM (last 5, most recent last):
${match.homeTeam.name}: ${homeForm.join('-') || 'No data'}
${match.awayTeam.name}: ${awayForm.join('-') || 'No data'}

HEAD TO HEAD:
${h2hStr}

Return ONLY this JSON, no markdown:

{
  "homeWinPct": <0-100>,
  "drawPct": <0-100>,
  "awayWinPct": <0-100>,
  "verdict": "<e.g. Arsenal Win>",
  "confidence": <0-100>,
  "bestBet": "<e.g. Arsenal Win + Over 1.5>",
  "bestBetOdds": "<e.g. @1.72>",
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "riskReason": "<one sentence>",
  "btts": <0-100>,
  "over25": <0-100>,
  "over15": <0-100>,
  "under25": <0-100>,
  "cleanSheet": <0-100>,
  "firstGoal": "<HOME|AWAY|EITHER>",
  "xgHome": <e.g. 1.84>,
  "xgAway": <e.g. 0.92>,
  "keyFactors": [
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" },
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" },
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" },
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" }
  ],
  "bestBetReason": "<2-3 sentences>"
}

Rules:
- homeWinPct + drawPct + awayWinPct = exactly 100
- keyFactors must have exactly 4 items
- All percentages are whole numbers
- xG has 2 decimal places`

    const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: `You are an expert football analyst. 
Always respond with valid JSON only. 
No markdown, no extra text.
Be realistic and unbiased in predictions.`,
        messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected AI response')

    const cleaned = content.text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
    const parsed = JSON.parse(cleaned)

    return {
        matchId: match.id,
        homeForm,
        awayForm,
        h2h,
        generatedAt: new Date().toISOString(),
        ...parsed,
    }
}