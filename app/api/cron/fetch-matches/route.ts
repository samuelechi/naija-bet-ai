import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const BASE_URL = 'https://v3.football.api-sports.io'
const apiHeaders = { 'x-apisports-key': process.env.API_FOOTBALL_KEY! }

const LEAGUE_IDS = [
    39,   // Premier League
    140,  // La Liga
    135,  // Serie A
    78,   // Bundesliga
    61,   // Ligue 1
    2,    // UEFA Champions League
    3,    // UEFA Europa League
    848,  // UEFA Conference League
    1,    // World Cup
    4,    // Euro Championship
    6,    // Africa Cup of Nations (AFCON)
    20,   // CAF Champions League
    686,  // NPFL (Nigerian Premier Football League)
    307,  // Saudi Pro League
    253,  // MLS
    88,   // Eredivisie
    94,   // Primeira Liga (Portugal)
    203,  // Turkish Süper Lig
    40,   // FA Cup
    48,   // Carabao Cup
    550,  // UEFA Nations League
    890,  // Women's Super League (WSL)
    879,  // Women's Champions League
]

const CURRENT_SEASON = new Date().getFullYear()

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

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]
    const allMatches: any[] = []
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
                }
            }

            // Stay under 10 req/min free tier limit
            await new Promise(r => setTimeout(r, 6500))
        } catch (e) {
            console.error(`Failed league ${leagueId}:`, e)
        }
    }

    if (allMatches.length === 0) {
        return NextResponse.json({ inserted: 0, message: 'No matches today' })
    }

    // Delete today's existing matches then re-insert fresh
    await supabase.from('matches').delete().eq('match_date', today)

    const { error } = await supabase.from('matches').insert(allMatches)

    if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        inserted: allMatches.length,
        message: `Fetched ${allMatches.length} matches for ${today}`,
    })
}