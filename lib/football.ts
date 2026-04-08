import { Match, FormResult, H2HResult } from '@/types'
import { getSupabaseAdmin } from '@/lib/supabase'

const BASE_URL = 'https://sports.bzzoiro.com'
const apiHeaders = { 'Authorization': `Token ${process.env.API_FOOTBALL_KEY}` }

function mapStatus(status: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' {
    if (status === 'finished') return 'FINISHED'
    if (status === 'inprogress') return 'LIVE'
    return 'SCHEDULED'
}

const shortName = (name: string) =>
    name.length > 12 ? name.split(' ').pop() ?? name : name

const teamCrest = (apiId: number) =>
    apiId ? `${BASE_URL}/img/team/${apiId}/` : ''

async function fetchAllEvents(date: string): Promise<any[]> {
    let allResults: any[] = []
    let url = `${BASE_URL}/api/events/?date_from=${date}&date_to=${date}`

    while (url) {
        const res = await fetch(url, { headers: apiHeaders })
        if (!res.ok) break
        const data = await res.json()
        allResults = [...allResults, ...(data.results || [])]
        url = data.next || null
    }

    return allResults
}

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
            homeScore: m.home_score,
            awayScore: m.away_score,
            currentMinute: m.current_minute,
            competition: {
                name: m.competition_name,
                code: m.competition_code,
            },
        }))
    }

    // No cache — fetch from Bzzoiro
    console.log('No matches in Supabase for today, fetching from Bzzoiro...')
    try {
        const events = await fetchAllEvents(today)

        const mappedMatches: Match[] = events.map((m: any): Match => ({
            id: m.id,
            utcDate: m.event_date,
            status: mapStatus(m.status),
            homeScore: m.home_score,
            awayScore: m.away_score,
            currentMinute: m.current_minute,
            competition: {
                name: m.league?.name ?? 'Unknown',
                code: String(m.league?.id ?? 0),
            },
            homeTeam: {
                id: m.home_team_obj?.id ?? 0,
                name: m.home_team,
                shortName: shortName(m.home_team_obj?.short_name || m.home_team),
                crest: teamCrest(m.home_team_obj?.api_id),
            },
            awayTeam: {
                id: m.away_team_obj?.id ?? 0,
                name: m.away_team,
                shortName: shortName(m.away_team_obj?.short_name || m.away_team),
                crest: teamCrest(m.away_team_obj?.api_id),
            },
        }))

        // Cache to Supabase
        if (mappedMatches.length > 0) {
            const rows = events.map((m: any) => ({
                id: m.id,
                home_team_id: m.home_team_obj?.id ?? 0,
                home_team_name: m.home_team,
                home_team_short: shortName(m.home_team_obj?.short_name || m.home_team),
                home_team_crest: teamCrest(m.home_team_obj?.api_id),
                away_team_id: m.away_team_obj?.id ?? 0,
                away_team_name: m.away_team,
                away_team_short: shortName(m.away_team_obj?.short_name || m.away_team),
                away_team_crest: teamCrest(m.away_team_obj?.api_id),
                utc_date: m.event_date,
                status: mapStatus(m.status),
                home_score: m.home_score ?? null,
                away_score: m.away_score ?? null,
                current_minute: m.current_minute ?? null,
                competition_name: m.league?.name ?? 'Unknown',
                competition_code: String(m.league?.id ?? 0),
                match_date: today,
            }))
            await supabase.from('matches').delete().eq('match_date', today)
            await supabase.from('matches').insert(rows)
            console.log(`Cached ${mappedMatches.length} matches to Supabase`)
        }

        return mappedMatches
    } catch (err) {
        console.error('Failed to fetch from Bzzoiro:', err)
        return []
    }
}

export async function getTeamForm(teamId: number): Promise<FormResult[]> {
    try {
        const res = await fetch(
            `${BASE_URL}/api/events/?team=${teamId}&status=finished&limit=5`,
            { headers: apiHeaders }
        )
        if (!res.ok) return []
        const data = await res.json()

        return (data.results || []).slice(-5).map((m: any): FormResult => {
            const homeGoals = m.home_score ?? 0
            const awayGoals = m.away_score ?? 0
            const isHome = m.home_team_obj?.id === teamId
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
        const res = await fetch(
            `${BASE_URL}/api/events/?team=${homeTeamId}&status=finished&limit=10`,
            { headers: apiHeaders }
        )
        if (!res.ok) return []
        const data = await res.json()

        const h2h = (data.results || [])
            .filter((m: any) =>
                (m.home_team_obj?.id === homeTeamId && m.away_team_obj?.id === awayTeamId) ||
                (m.home_team_obj?.id === awayTeamId && m.away_team_obj?.id === homeTeamId)
            )
            .slice(0, 5)

        return h2h.map((m: any): H2HResult => {
            const homeGoals = m.home_score ?? 0
            const awayGoals = m.away_score ?? 0
            const isHome = m.home_team_obj?.id === homeTeamId
            let result: 'W' | 'D' | 'L'
            if (homeGoals === awayGoals) result = 'D'
            else if (homeGoals > awayGoals) result = isHome ? 'W' : 'L'
            else result = isHome ? 'L' : 'W'
            return {
                date: new Date(m.event_date).toLocaleDateString('en-GB', {
                    month: 'short',
                    year: '2-digit',
                }),
                homeTeam: m.home_team,
                awayTeam: m.away_team,
                homeScore: homeGoals,
                awayScore: awayGoals,
                result,
            }
        })
    } catch {
        return []
    }
}
