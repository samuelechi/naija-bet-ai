import { Match, FormResult, H2HResult } from '@/types'
import { getSupabaseAdmin } from '@/lib/supabase'

const BASE_URL = 'https://v3.football.api-sports.io'
const apiHeaders = { 'x-apisports-key': process.env.API_FOOTBALL_KEY! }

async function apiFetch(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    const res = await fetch(url.toString(), { headers: apiHeaders })
    if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
    return res.json()
}

function mapStatus(short: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' {
    if (['FT', 'AET', 'PEN'].includes(short)) return 'FINISHED'
    if (['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'SCHEDULED'
    return 'LIVE'
}

export async function getTodaysMatches(): Promise<Match[]> {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('match_date', today)
        .order('utc_date', { ascending: true })

    if (!error && data && data.length > 0) {
        console.log(`Loaded ${data.length} matches from Supabase`)
        return data.map((m): Match => ({
            id: m.id,
            homeTeam: {
                id: m.home_team_id,
                name: m.home_team_name,
                shortName: m.home_team_short,
                crest: m.home_team_crest,
            },
            awayTeam: {
                id: m.away_team_id,
                name: m.away_team_name,
                shortName: m.away_team_short,
                crest: m.away_team_crest,
            },
            utcDate: m.utc_date,
            status: m.status,
            competition: {
                name: m.competition_name,
                code: m.competition_code,
            },
        }))
    }

    // No matches in Supabase — return empty instantly, cron populates at midnight
    console.log('No matches in Supabase for today')
    return []
}

export async function getTeamForm(teamId: number): Promise<FormResult[]> {
    try {
        const data = await apiFetch('/fixtures', {
            team: teamId,
            last: 5,
            status: 'FT',
        })

        return data.response.slice(-5).map((m: any): FormResult => {
            const homeGoals = m.goals.home ?? 0
            const awayGoals = m.goals.away ?? 0
            const isHome = m.teams.home.id === teamId
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
        const data = await apiFetch('/fixtures/headtohead', {
            h2h: `${homeTeamId}-${awayTeamId}`,
            last: 5,
            status: 'FT',
        })

        return data.response.slice(0, 5).map((m: any): H2HResult => {
            const homeGoals = m.goals.home ?? 0
            const awayGoals = m.goals.away ?? 0
            const isHome = m.teams.home.id === homeTeamId
            let result: 'W' | 'D' | 'L'
            if (homeGoals === awayGoals) result = 'D'
            else if (homeGoals > awayGoals) result = isHome ? 'W' : 'L'
            else result = isHome ? 'L' : 'W'
            return {
                date: new Date(m.fixture.date).toLocaleDateString('en-GB', {
                    month: 'short',
                    year: '2-digit',
                }),
                homeTeam: m.teams.home.name,
                awayTeam: m.teams.away.name,
                homeScore: homeGoals,
                awayScore: awayGoals,
                result,
            }
        })
    } catch {
        return []
    }
}
