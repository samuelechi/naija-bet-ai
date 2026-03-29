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

    // ── Read from Supabase first (instant) ───────────────────────────────────
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

    // ── Fallback: fetch live from API if Supabase is empty ───────────────────
    // This only happens if cron hasn't run yet today
    console.log('No matches in Supabase, fetching from API-Football...')

    const LEAGUE_IDS = [39, 140, 135, 78, 61, 2, 3, 848, 6, 20, 686, 307, 253, 88, 94, 203, 40, 48, 550, 890, 879]
    const CURRENT_SEASON = new Date().getFullYear()
    const allMatches: Match[] = []
    const seenIds = new Set<number>()

    for (const leagueId of LEAGUE_IDS) {
        try {
            const data = await apiFetch('/fixtures', {
                league: leagueId,
                date: today,
                season: CURRENT_SEASON,
            })

            if (data.response?.length) {
                for (const m of data.response) {
                    if (seenIds.has(m.fixture.id)) continue
                    seenIds.add(m.fixture.id)

                    const shortName = (name: string) =>
                        name.length > 12 ? name.split(' ').pop() ?? name : name

                    allMatches.push({
                        id: m.fixture.id,
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
                        utcDate: m.fixture.date,
                        status: mapStatus(m.fixture.status.short),
                        competition: {
                            name: m.league.name,
                            code: String(m.league.id),
                        },
                    })
                }
            }

            await new Promise(r => setTimeout(r, 6500))
        } catch (e) {
            console.error(`Failed league ${leagueId}:`, e)
        }
    }

    return allMatches.sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    )
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
