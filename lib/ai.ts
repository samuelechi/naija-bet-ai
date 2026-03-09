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
  "xgHome": <e.g. 1.84>,
  "xgAway": <e.g. 0.92>,
  "riskLevel": "<Low|Medium|High>",
  "riskReason": "<one sentence>",
  "summary": "<2-3 sentence match overview for bettors>",
  "keyFactors": [
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" },
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" },
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" },
    { "icon": "<emoji>", "text": "<max 50 chars>", "type": "<positive|negative|neutral>" }
  ],
  "bestBet": {
    "type": "<1X2|BTTS|Over/Under|Double Chance|Correct Score|HT/FT|Asian Handicap|First Goal|Clean Sheet>",
    "pick": "<your pick>",
    "confidence": <0-100>,
    "odds": "<e.g. 1.75>",
    "reasoning": "<1-2 sentence sharp reasoning>"
  },
  "predictions": {
    "1X2": {
      "pick": "<${match.homeTeam.shortName} Win|Draw|${match.awayTeam.shortName} Win>",
      "confidence": <0-100>,
      "odds": "<e.g. 2.10>",
      "reasoning": "<sharp 1-2 sentence reasoning>"
    },
    "BTTS": {
      "pick": "<Yes|No>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.80>",
      "reasoning": "<sharp reasoning>"
    },
    "Over/Under": {
      "line": "<0.5|1.5|2.5|3.5>",
      "pick": "<Over|Under>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.90>",
      "reasoning": "<sharp reasoning>"
    },
    "Double Chance": {
      "pick": "<${match.homeTeam.shortName}/Draw|${match.awayTeam.shortName}/Draw|${match.homeTeam.shortName}/${match.awayTeam.shortName}>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.40>",
      "reasoning": "<sharp reasoning>"
    },
    "Correct Score": {
      "pick": "<e.g. 2-1>",
      "confidence": <0-100>,
      "odds": "<e.g. 7.50>",
      "reasoning": "<sharp reasoning>"
    },
    "HT/FT": {
      "pick": "<e.g. Home/Home|Draw/Home|Away/Away>",
      "confidence": <0-100>,
      "odds": "<e.g. 3.20>",
      "reasoning": "<sharp reasoning>"
    },
    "Asian Handicap": {
      "pick": "<e.g. ${match.homeTeam.shortName} -0.5|${match.awayTeam.shortName} +1>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.95>",
      "reasoning": "<sharp reasoning>"
    },
    "First Goal": {
      "pick": "<Home|Away|No Goal>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.65>",
      "reasoning": "<sharp reasoning>"
    },
    "Clean Sheet": {
      "pick": "<Home|Away|Neither>",
      "confidence": <0-100>,
      "odds": "<e.g. 2.30>",
      "reasoning": "<sharp reasoning>"
    }
  }
}

Rules:
- homeWinPct + drawPct + awayWinPct = exactly 100
- keyFactors must have exactly 4 items
- All percentages are whole numbers
- xG has 2 decimal places
- bestBet must be the single strongest pick across ALL prediction types
- confidence scores must be realistic: 60-85 for most; Correct Score rarely above 30; HT/FT rarely above 40
- Over/Under: pick the line with highest confidence, not always 2.5
- riskLevel: Low if bestBet confidence > 75, Medium if 60-75, High if below 60
- Odds are fair market estimates, not inflated bookmaker odds`

    const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1500,
        system: `You are NaijaBetAI, an expert football analyst and betting predictions engine.
Always respond with valid JSON only.
No markdown, no extra text, no preamble.
Be realistic and unbiased in all predictions.
Prioritise safe, high-probability bets for Nigerian sports bettors.`,
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