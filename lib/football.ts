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

const shortName = (name: string) =>
    name.length > 12 ? name.split(' ').pop() ?? name : name

const LEAGUE_IDS = [
    39, 140, 135, 78, 61, 2, 3, 848, 6, 20,
    686, 307, 253, 88, 94, 203, 40, 48, 550, 890, 879
]

export async function getTodaysMatches(): Promise<Match[]> {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]

    // Try Supabase cache first
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

    // No cache — fetch from API-Football in parallel
    console.log('No matches in Supabase for today, fetching from API-Football...')
    try {
        const results = await Promise.allSettled(
            LEAGUE_IDS.map(leagueId =>
                apiFetch('/fixtures', {
                    league: leagueId,
                    date: today,
                    season: 2025,
                })
            )
        )

        const seenIds = new Set<number>()
        const allMatches: any[] = []
        const mappedMatches: Match[] = []

        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`League ${LEAGUE_IDS[i]} failed:`, result.reason)
                return
            }
            for (const m of result.value.response || []) {
                if (seenIds.has(m.fixture.id)) continue
                seenIds.add(m.fixture.id)

                allMatches.push({
                    id: m.fixture.id,
                    home_team_id: m.teams.home.id,
                    home_team_name: m.teams.home.name,
                    home_team_short: shortName(m.teams.home.name),
                    home_team_crest: m.teams.home.logo,
                    away_team_id: m.teams.away.id,
                    away_team_name: m.teams.away.name,
                    away_team_short: shortName(m.teams.away.name),
                    away_team_crest: m.teams.away.logo,
                    utc_date: m.fixture.date,
                    status: mapStatus(m.fixture.status.short),
                    competition_name: m.league.name,
                    competition_code: String(m.league.id),
                    match_date: today,
                })

                mappedMatches.push({
                    id: m.fixture.id,
                    utcDate: m.fixture.date,
                    status: mapStatus(m.fixture.status.short),
                    competition: {
                        name: m.league.name,
                        code: String(m.league.id),
                    },
                    homeTeam: {
                        id: m.teams.home.id,
                        name: m.teams.home.name,
                        shortName: shortName(m.teams.home.name),
                        crest: m.teams.home.logo,
                    },
                    awayTeam: {
                        id: m.teams.away.id,
                        name: m.teams.away.name,
                        shortName: shortName(m.teams.away.name),
                        crest: m.teams.away.logo,
                    },
                })
            }
        })

        // Cache to Supabase
        if (allMatches.length > 0) {
            await supabase.from('matches').delete().eq('match_date', today)
            await supabase.from('matches').insert(allMatches)
            console.log(`Cached ${allMatches.length} matches to Supabase`)
        }

        return mappedMatches
    } catch (err) {
        console.error('Failed to fetch from API-Football:', err)
        return []
    }
}

export async function getTeamForm(teamId: number): Promise<FormResult[]> {
    try {
        const data = await apiFetch('/fixtures', {
            team: teamId,
            last: 5,
            season: 2025,
        })

        return (data.response || []).slice(-5).map((m: any): FormResult => {
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
            season: 2025,
        })

        return (data.response || []).slice(0, 5).map((m: any): H2HResult => {
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
