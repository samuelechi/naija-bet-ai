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

export interface Prediction {
    matchId: number
    homeWinPct: number
    drawPct: number
    awayWinPct: number
    verdict: string
    confidence: number
    bestBet: string
    bestBetOdds: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    riskReason: string
    btts: number
    over25: number
    over15: number
    under25: number
    cleanSheet: number
    firstGoal: 'HOME' | 'AWAY' | 'EITHER'
    xgHome: number
    xgAway: number
    keyFactors: KeyFactor[]
    bestBetReason: string
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