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
  "verdict": "<e.g. Arsenal Win | Draw | Over 1.5 Goals>",
  "confidence": <0-100>,
  "bestBet": "<the single safest bet from the list below>",
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

BEST BET SELECTION RULES (pick ONE, prioritise safety):
- If over15 >= 75%: bestBet = "Over 1.5 Goals"
- Else if btts >= 65%: bestBet = "Both Teams to Score"
- Else if over25 >= 65%: bestBet = "Over 2.5 Goals"
- Else if homeWinPct >= 70%: bestBet = "${match.homeTeam.name} Win"
- Else if awayWinPct >= 70%: bestBet = "${match.awayTeam.name} Win"
- Else if (homeWinPct + drawPct) >= 75%: bestBet = "${match.homeTeam.name} or Draw (Double Chance)"
- Else if (awayWinPct + drawPct) >= 75%: bestBet = "${match.awayTeam.name} or Draw (Double Chance)"
- Else if under25 >= 65%: bestBet = "Under 2.5 Goals"
- Else: bestBet = "No Value Bet — Skip This Match"

VERDICT RULES:
- verdict = the most likely outcome: "${match.homeTeam.name} Win", "Draw", or "${match.awayTeam.name} Win"

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
Be realistic and unbiased in predictions.
Prioritise safe, high-probability bets over risky outright winners.`,
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