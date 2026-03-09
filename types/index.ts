export interface Team {
    id: number
    name: string
    shortName: string
    crest?: string
}

export interface Match {
    id: number
    homeTeam: Team
    awayTeam: Team
    utcDate: string
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED'
    competition: {
        name: string
        code: string
    }
}

export interface KeyFactor {
    icon: string
    text: string
    type: 'positive' | 'negative' | 'neutral'
}

export interface H2HResult {
    date: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    result: 'W' | 'D' | 'L'
}

export type FormResult = 'W' | 'D' | 'L'

// ─── Individual prediction market ────────────────────────────────────────────
export interface MarketPrediction {
    pick: string
    confidence: number
    odds: string
    reasoning: string
}

export interface OverUnderPrediction extends MarketPrediction {
    line: '0.5' | '1.5' | '2.5' | '3.5'
}

// ─── Best bet ────────────────────────────────────────────────────────────────
export interface BestBet {
    type: '1X2' | 'BTTS' | 'Over/Under' | 'Double Chance' | 'Correct Score' | 'HT/FT' | 'Asian Handicap' | 'First Goal' | 'Clean Sheet'
    pick: string
    confidence: number
    odds: string
    reasoning: string
}

// ─── Full prediction ──────────────────────────────────────────────────────────
export interface Prediction {
    matchId: number

    // Match outcome probabilities
    homeWinPct: number
    drawPct: number
    awayWinPct: number

    // Expected goals
    xgHome: number
    xgAway: number

    // Risk
    riskLevel: 'Low' | 'Medium' | 'High'
    riskReason: string

    // Summary
    summary: string

    // Analysis
    keyFactors: KeyFactor[]

    // Best single pick
    bestBet: BestBet

    // All 9 markets
    predictions: {
        '1X2': MarketPrediction
        'BTTS': MarketPrediction
        'Over/Under': OverUnderPrediction
        'Double Chance': MarketPrediction
        'Correct Score': MarketPrediction
        'HT/FT': MarketPrediction
        'Asian Handicap': MarketPrediction
        'First Goal': MarketPrediction
        'Clean Sheet': MarketPrediction
    }

    // Match context
    homeForm: FormResult[]
    awayForm: FormResult[]
    h2h: H2HResult[]
    generatedAt: string
}

export type SubscriptionPlan = 'free' | 'pro' | 'vip'

export interface UserProfile {
    id: string
    email: string
    fullName: string
    plan: SubscriptionPlan
    subscriptionStatus: 'active' | 'inactive'
    winRate: number
    tipsUsed: number
    streak: number
}