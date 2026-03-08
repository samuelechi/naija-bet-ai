import axios from 'axios'
import { Match, FormResult, H2HResult } from '@/types'

const footballData = axios.create({
    baseURL: 'https://api.football-data.org/v4',
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
})

// ── In-memory cache ──────────────────────────────────────────────
let matchCache: { data: Match[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getTodaysMatches(): Promise<Match[]> {
    // Return cached data if still fresh
    if (matchCache && Date.now() - matchCache.timestamp < CACHE_TTL) {
        console.log('Returning cached matches')
        return matchCache.data
    }

    const today = new Date().toISOString().split('T')[0]
    const allMatches: Match[] = []
    const leagueIds = [2021, 2014, 2019, 2002, 2001]

    for (const id of leagueIds) {
        try {
            const res = await footballData.get(`/competitions/${id}/matches`, {
                params: { dateFrom: today, dateTo: today },
            })
            const matches = res.data.matches.map((m: any): Match => ({
                id: m.id,
                homeTeam: {
                    id: m.homeTeam.id,
                    name: m.homeTeam.name,
                    shortName: m.homeTeam.shortName || m.homeTeam.tla || m.homeTeam.name,
                    crest: m.homeTeam.crest,
                },
                awayTeam: {
                    id: m.awayTeam.id,
                    name: m.awayTeam.name,
                    shortName: m.awayTeam.shortName || m.awayTeam.tla || m.awayTeam.name,
                    crest: m.awayTeam.crest,
                },
                utcDate: m.utcDate,
                status: m.status,
                competition: {
                    name: m.competition.name,
                    code: m.competition.code,
                },
            }))
            allMatches.push(...matches)

            // Delay between calls to respect rate limit (10 req/min = 1 per 6s to be safe)
            await new Promise(r => setTimeout(r, 1200))
        } catch (e: any) {
            if (e?.response?.status === 429) {
                console.warn(`Rate limited on league ${id}, skipping`)
            } else {
                console.error(`Failed league ${id}:`, e)
            }
        }
    }

    const sorted = allMatches.sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    )

    // Save to cache
    matchCache = { data: sorted, timestamp: Date.now() }
    console.log(`Cached ${sorted.length} matches`)

    return sorted
}

export async function getTeamForm(teamId: number): Promise<FormResult[]> {
    try {
        const res = await footballData.get(`/teams/${teamId}/matches`, {
            params: { limit: 5, status: 'FINISHED' },
        })
        return res.data.matches.slice(-5).map((m: any): FormResult => {
            const homeGoals = m.score.fullTime.home ?? 0
            const awayGoals = m.score.fullTime.away ?? 0
            const isHome = m.homeTeam.id === teamId
            if (homeGoals === awayGoals) return 'D'
            if (homeGoals > awayGoals) return isHome ? 'W' : 'L'
            return isHome ? 'L' : 'W'
        })
    } catch {
        return []
    }
}

export async function getH2H(
    homeTeamId: number,
    awayTeamId: number
): Promise<H2HResult[]> {
    try {
        const res = await footballData.get(`/teams/${homeTeamId}/matches`, {
            params: { limit: 20, status: 'FINISHED' },
        })
        return res.data.matches
            .filter((m: any) =>
                (m.homeTeam.id === homeTeamId && m.awayTeam.id === awayTeamId) ||
                (m.homeTeam.id === awayTeamId && m.awayTeam.id === homeTeamId)
            )
            .slice(0, 5)
            .map((m: any): H2HResult => {
                const homeGoals = m.score.fullTime.home ?? 0
                const awayGoals = m.score.fullTime.away ?? 0
                const isHome = m.homeTeam.id === homeTeamId
                let result: 'W' | 'D' | 'L'
                if (homeGoals === awayGoals) result = 'D'
                else if (homeGoals > awayGoals) result = isHome ? 'W' : 'L'
                else result = isHome ? 'L' : 'W'
                return {
                    date: new Date(m.utcDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
                    homeTeam: m.homeTeam.shortName || m.homeTeam.name,
                    awayTeam: m.awayTeam.shortName || m.awayTeam.name,
                    homeScore: homeGoals,
                    awayScore: awayGoals,
                    result,
                }
            })
    } catch {
        return []
    }
}