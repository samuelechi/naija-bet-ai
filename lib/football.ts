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

// Updated to use the correct media.api-sports.io format as a fallback
const teamCrest = (apiId: number) =>
    apiId ? `https://media.api-sports.io/football/teams/${apiId}.png` : ''

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

    try {
        const events = await fetchAllEvents(today)

        if (events.length > 0) {
            // 1. Fetch existing matches first to see if we already have Supabase crests
            const { data: existingMatches } = await supabase
                .from('matches')
                .select('id, home_team_crest, away_team_crest')
                .in('id', events.map(e => e.id));

            const existingCrests = new Map(existingMatches?.map(m => [m.id, m]) || []);

            const rows = events.map((m: any) => {
                const existing = existingCrests.get(m.id);

                // SHIELD LOGIC: If the database already has a Supabase URL, do NOT overwrite it
                const homeCrest = existing?.home_team_crest?.includes('supabase.co')
                    ? existing.home_team_crest
                    : teamCrest(m.home_team_obj?.api_id);

                const awayCrest = existing?.away_team_crest?.includes('supabase.co')
                    ? existing.away_team_crest
                    : teamCrest(m.away_team_obj?.api_id);

                return {
                    id: m.id,
                    home_team_id: m.home_team_obj?.id ?? 0,
                    home_team_name: m.home_team,
                    home_team_short: shortName(m.home_team_obj?.short_name || m.home_team),
                    home_team_crest: homeCrest,
                    away_team_id: m.away_team_obj?.id ?? 0,
                    away_team_name: m.away_team,
                    away_team_short: shortName(m.away_team_obj?.short_name || m.away_team),
                    away_team_crest: awayCrest,
                    utc_date: m.event_date,
                    status: mapStatus(m.status),
                    home_score: m.home_score ?? null,
                    away_score: m.away_score ?? null,
                    current_minute: m.current_minute ?? null,
                    competition_name: m.league?.name ?? 'Unknown',
                    competition_code: String(m.league?.id ?? 0),
                    match_date: today,
                };
            });

            await supabase
                .from('matches')
                .upsert(rows, { onConflict: 'id' })

            console.log(`Upserted ${rows.length} matches to Supabase (Crests Shielded)`)

            return rows.map((m: any): Match => ({
                id: m.id,
                utcDate: m.utc_date,
                status: m.status,
                homeScore: m.home_score,
                awayScore: m.away_score,
                currentMinute: m.current_minute,
                competition: {
                    name: m.competition_name,
                    code: m.competition_code,
                },
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
            }))
        }
    } catch (err) {
        console.error('Failed to fetch from Bzzoiro:', err)
    }

    // Fallback to Supabase cache
    console.log('Falling back to Supabase cache...')
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('match_date', today)
        .order('utc_date', { ascending: true })

    if (error || !data) return []

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

// ... rest of the file (getTeamForm and getH2H) remains the same