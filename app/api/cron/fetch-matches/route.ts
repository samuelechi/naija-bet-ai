import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const BASE_URL = 'https://v3.football.api-sports.io'
const apiHeaders = { 'x-apisports-key': process.env.API_FOOTBALL_KEY! }

const LEAGUE_IDS = [
    39, 140, 135, 78, 61, 2, 3, 848, 6, 20,
    686, 307, 253, 88, 94, 203, 40, 48, 550, 890, 879
]

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

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('API KEY:', process.env.API_FOOTBALL_KEY?.slice(0, 5)) // ADD THIS LINE

    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]

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
        }
    })

    if (allMatches.length === 0) {
        return NextResponse.json({ inserted: 0, message: 'No matches today' })
    }

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