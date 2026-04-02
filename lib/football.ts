import { Match, FormResult, H2HResult } from '@/types'
import { getSupabaseAdmin } from '@/lib/supabase'

const BASE_URL = 'https://api.football-data.org/v4'
const apiHeaders = { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! }

async function apiFetch(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    const res = await fetch(url.toString(), { headers: apiHeaders })
    if (!res.ok) throw new Error(`Football-data error: ${res.status}`)
    return res.json()
}

function mapStatus(status: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' {
    if (['FINISHED', 'AWARDED'].includes(status)) return 'FINISHED'
    if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(status)) return 'LIVE'
    return 'SCHEDULED'
}

// League IDs on football-data.org
const LEAGUE_IDS = [
    2021, // Premier League
    2001, // Champions League
    2018, // Europa League
    2002, // Bundesliga
    2019, // Serie A
    2014, // La Liga
    2015, // Ligue 1
    2003, // Eredivisie
    2017, // Primeira Liga
]

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

    // No cache — fetch from API and store
    console.log('No matches in Supabase for today, fetching from API...')
    try {
        const data = await apiFetch('/matches', { date: today })
        const matches: Match[] = (data.matches || [])
            .filter((m: any) => LEAGUE_IDS.includes(m.competition.id))
            .map((m: any): Match => ({
                id: m.id,
                utcDate: m.utcDate,
                status: mapStatus(m.status),
                competition: {
                    name: m.competition.name,
                    code: m.competition.code,
                },
                homeTeam: {
                    id: m.homeTeam.id,
                    name: m.homeTeam.name,
                    shortName: m.homeTeam.shortName || m.homeTeam.name,
                    crest: m.homeTeam.crest || '',
                },
                awayTeam: {
                    id: m.awayTeam.id,
                    name: m.awayTeam.name,
                    shortName: m.awayTeam.shortName || m.awayTeam.name,
                    crest: m.awayTeam.crest || '',
                },
            }))

        // Cache to Supabase
        if (matches.length > 0) {
            await supabase.from('matches').upsert(
                matches.map(m => ({
                    id: m.id,
                    home_team_id: m.homeTeam.id,
                    home_team_name: m.homeTeam.name,
                    home_team_short: m.homeTeam.shortName,
                    home_team_crest: m.homeTeam.crest,
                    away_team_id: m.awayTeam.id,
                    away_team_name: m.awayTeam.name,
                    away_team_short: m.awayTeam.shortName,
                    away_team_crest: m.awayTeam.crest,
                    utc_date: m.utcDate,
                    status: m.status,
                    competition_name: m.competition.name,
                    competition_code: m.competition.code,
                    match_date: today,
                })),
                { onConflict: 'id', ignoreDuplicates: true }
            )
            console.log(`Cached ${matches.length} matches to Supabase`)
        }

        return matches
    } catch (err) {
        console.error('Failed to fetch from football-data.org:', err)
        return []
    }
}

export async function getTeamForm(teamId: number): Promise<FormResult[]> {
    try {
        const data = await apiFetch(`/teams/${teamId}/matches`, {
            status: 'FINISHED',
            limit: 5,
        })

        return data.matches.slice(-5).map((m: any): FormResult => {
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
        const data = await apiFetch(`/teams/${homeTeamId}/matches`, {
            status: 'FINISHED',
            limit: 10,
        })

        const h2h = data.matches
            .filter((m: any) =>
                (m.homeTeam.id === homeTeamId && m.awayTeam.id === awayTeamId) ||
                (m.homeTeam.id === awayTeamId && m.awayTeam.id === homeTeamId)
            )
            .slice(0, 5)

        return h2h.map((m: any): H2HResult => {
            const homeGoals = m.score.fullTime.home ?? 0
            const awayGoals = m.score.fullTime.away ?? 0
            const isHome = m.homeTeam.id === homeTeamId
            let result: 'W' | 'D' | 'L'
            if (homeGoals === awayGoals) result = 'D'
            else if (homeGoals > awayGoals) result = isHome ? 'W' : 'L'
            else result = isHome ? 'L' : 'W'
            return {
                date: new Date(m.utcDate).toLocaleDateString('en-GB', {
                    month: 'short',
                    year: '2-digit',
                }),
                homeTeam: m.homeTeam.name,
                awayTeam: m.awayTeam.name,
                homeScore: homeGoals,
                awayScore: awayGoals,
                result,
            }
        })
    } catch {
        return []
    }
}
