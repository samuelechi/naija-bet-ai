import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]

    try {
        // Fetch all today's matches in one request — Bzzoiro returns everything
        const res = await fetch(
            `${BASE_URL}/api/events/?date_from=${today}&date_to=${today}`,
            { headers: apiHeaders }
        )

        if (!res.ok) throw new Error(`Bzzoiro error: ${res.status}`)
        const data = await res.json()
        const events = data.results || []

        if (events.length === 0) {
            return NextResponse.json({ inserted: 0, message: 'No matches today' })
        }

        const allMatches = events.map((m: any) => ({
            id: m.id,
            home_team_id: m.home_team_obj?.id ?? 0,
            home_team_name: m.home_team,
            home_team_short: shortName(m.home_team_obj?.short_name || m.home_team),
            home_team_crest: '',
            away_team_id: m.away_team_obj?.id ?? 0,
            away_team_name: m.away_team,
            away_team_short: shortName(m.away_team_obj?.short_name || m.away_team),
            away_team_crest: '',
            utc_date: m.event_date,
            status: mapStatus(m.status),
            competition_name: m.league?.name ?? 'Unknown',
            competition_code: String(m.league?.id ?? 0),
            match_date: today,
        }))

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
    } catch (err) {
        console.error('Bzzoiro fetch error:', err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}