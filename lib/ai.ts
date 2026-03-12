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

  const home = match.homeTeam.shortName
  const away = match.awayTeam.shortName

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
    "type": "<1X2|BTTS|Over/Under|Double Chance|Correct Score|HT/FT|Asian Handicap|First Goal|Clean Sheet|Draw No Bet|BTTS & Win|Odd/Even Goals|Multi-Goals|Both Halves Over 0.5|Win to Nil>",
    "pick": "<your pick>",
    "confidence": <0-100>,
    "odds": "<e.g. 1.75>",
    "reasoning": "<1-2 sentence sharp reasoning>"
  },
  "predictions": {
    "1X2": {
      "pick": "<${home} Win|Draw|${away} Win>",
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
      "pick": "<${home}/Draw|${away}/Draw|${home}/${away}>",
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
      "pick": "<Home/Home|Draw/Home|Away/Away|Home/Draw|Away/Draw|Draw/Away|Draw/Draw|Home/Away|Away/Home>",
      "confidence": <0-100>,
      "odds": "<e.g. 3.20>",
      "reasoning": "<sharp reasoning>"
    },
    "Asian Handicap": {
      "pick": "<e.g. ${home} -0.5|${away} +1>",
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
    },
    "Draw No Bet": {
      "pick": "<${home}|${away}>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.55>",
      "reasoning": "<sharp reasoning — if draw is likely, pick the stronger side for DNB>"
    },
    "BTTS & Win": {
      "pick": "<${home} & BTTS|${away} & BTTS>",
      "confidence": <0-100>,
      "odds": "<e.g. 2.80>",
      "reasoning": "<sharp reasoning>"
    },
    "Odd/Even Goals": {
      "pick": "<Odd|Even>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.90>",
      "reasoning": "<sharp reasoning based on xG and typical scorelines>"
    },
    "Multi-Goals": {
      "pick": "<1-2|2-3|3-4|2-4|1-3>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.60>",
      "reasoning": "<sharp reasoning — pick the range most likely given xG>"
    },
    "Both Halves Over 0.5": {
      "pick": "<Yes|No>",
      "confidence": <0-100>,
      "odds": "<e.g. 1.75>",
      "reasoning": "<sharp reasoning — both teams must score in each half>"
    },
    "Win to Nil": {
      "pick": "<${home}|${away}>",
      "confidence": <0-100>,
      "odds": "<e.g. 2.50>",
      "reasoning": "<sharp reasoning — team wins and keeps clean sheet>"
    }
  }
}

Rules:
- homeWinPct + drawPct + awayWinPct = exactly 100
- keyFactors must have exactly 4 items
- All percentages are whole numbers
- xG has 2 decimal places
- bestBet must be the single strongest pick across ALL 15 prediction types
- confidence scores must be realistic:
  * 1X2 straight win: 55-80
  * BTTS: 55-80
  * Over/Under: 60-82
  * Double Chance: 65-88
  * Draw No Bet: 60-82
  * BTTS & Win: 45-70
  * Odd/Even Goals: 50-65
  * Multi-Goals: 60-80
  * Both Halves Over 0.5: 55-75
  * Win to Nil: 40-65
  * Correct Score: max 30
  * HT/FT: max 40
  * Asian Handicap: 55-78
  * First Goal: 55-72
  * Clean Sheet: 45-70
- Over/Under: pick the line with highest confidence, not always 2.5
- riskLevel: Low if bestBet confidence >= 75, Medium if 60-74, High if below 60
- Odds are fair market estimates
- BTTS & Win: only pick if xG suggests both teams score AND one team is dominant
- Win to Nil: only pick if one team has xG > 1.5 and opposing xG < 0.6
- Draw No Bet: great pick when one team is favoured but draw is possible
- Multi-Goals: pick the 2-goal range that best fits combined xG
- Both Halves Over 0.5: pick Yes only if both teams are likely to score across 90 mins`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    system: `You are NaijaBetAI, an expert football analyst and betting predictions engine targeting Nigerian sports bettors.
Always respond with valid JSON only.
No markdown, no extra text, no preamble.
Be realistic and data-driven. Never fabricate confident picks without evidence.
Prioritise value bets — picks with high confidence AND reasonable odds.
Nigerian bettors love: BTTS, Over/Under, Double Chance, Draw No Bet, Correct Score accumulators.`,
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