import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const FOOTBALL_API = 'https://api.football-data.org/v4'
const headers = { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! }

function evaluateBet(verdict: string, homeScore: number, awayScore: number, homeTeam: string, awayTeam: string): 'WON' | 'LOST' | 'DRAW' {
    const v = verdict.toLowerCase()
    const totalGoals = homeScore + awayScore
    const isDraw = homeScore === awayScore
    const homeWon = homeScore > awayScore
    const awayWon = awayScore > homeScore

    // Goal markets
    if (v.includes('over 1.5')) return totalGoals > 1 ? 'WON' : 'LOST'
    if (v.includes('over 2.5')) return totalGoals > 2 ? 'WON' : 'LOST'
    if (v.includes('under 2.5')) return totalGoals < 3 ? 'WON' : 'LOST'
    if (v.includes('both teams to score') || v.includes('btts')) return (homeScore > 0 && awayScore > 0) ? 'WON' : 'LOST'

    // Double chance
    if (v.includes('or draw')) {
        if (v.includes(homeTeam.toLowerCase())) return (homeWon || isDraw) ? 'WON' : 'LOST'
        if (v.includes(awayTeam.toLowerCase())) return (awayWon || isDraw) ? 'WON' : 'LOST'
    }

    // Straight win
    if (v.includes(homeTeam.toLowerCase()) && v.includes('win')) return homeWon ? 'WON' : isDraw ? 'DRAW' : 'LOST'
    if (v.includes(awayTeam.toLowerCase()) && v.includes('win')) return awayWon ? 'WON' : isDraw ? 'DRAW' : 'LOST'

    // Draw verdict
    if (v === 'draw') return isDraw ? 'WON' : 'LOST'

    // No value bet
    if (v.includes('no value')) return 'DRAW' // treat as void/push

    return 'LOST'
}

export async function GET(request: NextRequest) {
    // Secure the cron endpoint
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get all pending predictions from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: pending, error } = await supabase
        .from('predictions')
        .select('id, match_id, verdict, home_team, away_team, match_date')
        .is('result', null)
        .gte('match_date', sevenDaysAgo)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!pending || pending.length === 0) return NextResponse.json({ updated: 0, message: 'No pending predictions' })

    // Get unique match IDs
    const matchIds = [...new Set(pending.map(p => p.match_id))]

    let updated = 0
    const results: Record<number, { homeScore: number; awayScore: number; status: string }> = {}

    // Fetch match results from football-data.org
    for (const matchId of matchIds) {
        try {
            const res = await fetch(`${FOOTBALL_API}/matches/${matchId}`, { headers })
            if (!res.ok) continue
            const data = await res.json()

            if (data.status === 'FINISHED' && data.score?.fullTime) {
                results[matchId] = {
                    homeScore: data.score.fullTime.home,
                    awayScore: data.score.fullTime.away,
                    status: data.status,
                }
            }
            // Rate limit
            await new Promise(r => setTimeout(r, 300))
        } catch {
            continue
        }
    }

    // Update predictions with results
    for (const prediction of pending) {
        const result = results[prediction.match_id]
        if (!result) continue

        const outcome = evaluateBet(
            prediction.verdict,
            result.homeScore,
            result.awayScore,
            prediction.home_team,
            prediction.away_team
        )

        await supabase
            .from('predictions')
            .update({ result: outcome })
            .eq('id', prediction.id)

        updated++
    }

    return NextResponse.json({ updated, total: pending.length, message: `Updated ${updated} predictions` })
}