import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const FOOTBALL_API = 'https://api.football-data.org/v4'
const headers = { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! }

function evaluateBet(
    verdict: string,
    homeScore: number,
    awayScore: number,
    homeTeam: string,
    awayTeam: string
): 'WON' | 'LOST' | 'DRAW' {
    const v = verdict.toLowerCase().trim()
    const home = homeTeam.toLowerCase().trim()
    const away = awayTeam.toLowerCase().trim()
    const totalGoals = homeScore + awayScore
    const isDraw = homeScore === awayScore
    const homeWon = homeScore > awayScore
    const awayWon = awayScore > homeScore

    // ── 1X2 ──────────────────────────────────────────────────────────────────
    // "1X2: Bayern Win" | "1X2: Draw" | "1X2: Man City Win"
    if (v.startsWith('1x2:')) {
        const pick = v.replace('1x2:', '').trim()
        if (pick === 'draw') return isDraw ? 'WON' : 'LOST'
        if (pick.includes(home)) return homeWon ? 'WON' : 'LOST'
        if (pick.includes(away)) return awayWon ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── BTTS ──────────────────────────────────────────────────────────────────
    // "BTTS: Yes" | "BTTS: No"
    if (v.startsWith('btts:') && !v.startsWith('btts & win')) {
        const pick = v.replace('btts:', '').trim()
        const bothScored = homeScore > 0 && awayScore > 0
        if (pick === 'yes') return bothScored ? 'WON' : 'LOST'
        if (pick === 'no') return !bothScored ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Over/Under ────────────────────────────────────────────────────────────
    // "Over/Under: Over 2.5" | "Over/Under: Under 1.5"
    if (v.startsWith('over/under:')) {
        const pick = v.replace('over/under:', '').trim()
        const lineMatch = pick.match(/(\d+\.?\d*)/)
        if (!lineMatch) return 'LOST'
        const line = parseFloat(lineMatch[1])
        if (pick.startsWith('over')) return totalGoals > line ? 'WON' : 'LOST'
        if (pick.startsWith('under')) return totalGoals < line ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Double Chance ─────────────────────────────────────────────────────────
    // "Double Chance: PSG/Draw" | "Double Chance: Arsenal/Draw" | "Double Chance: PSG/Arsenal"
    if (v.startsWith('double chance:')) {
        const pick = v.replace('double chance:', '').trim()
        if (pick.includes('/draw')) {
            const team = pick.replace('/draw', '').trim()
            if (team.includes(home)) return (homeWon || isDraw) ? 'WON' : 'LOST'
            if (team.includes(away)) return (awayWon || isDraw) ? 'WON' : 'LOST'
        }
        if (pick.includes('draw/')) {
            const team = pick.replace('draw/', '').trim()
            if (team.includes(home)) return (homeWon || isDraw) ? 'WON' : 'LOST'
            if (team.includes(away)) return (awayWon || isDraw) ? 'WON' : 'LOST'
        }
        if (pick.includes(home) && pick.includes(away)) return !isDraw ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Correct Score ─────────────────────────────────────────────────────────
    // "Correct Score: 2-1"
    if (v.startsWith('correct score:')) {
        const pick = v.replace('correct score:', '').trim()
        const scoreMatch = pick.match(/(\d+)\s*[-:]\s*(\d+)/)
        if (!scoreMatch) return 'LOST'
        const predHome = parseInt(scoreMatch[1])
        const predAway = parseInt(scoreMatch[2])
        return (homeScore === predHome && awayScore === predAway) ? 'WON' : 'LOST'
    }

    // ── HT/FT ─────────────────────────────────────────────────────────────────
    // Void — no HT score available from football-data.org free tier
    if (v.startsWith('ht/ft:')) return 'DRAW'

    // ── Asian Handicap ────────────────────────────────────────────────────────
    // "Asian Handicap: Bayern -0.5" | "Asian Handicap: Man City +1"
    if (v.startsWith('asian handicap:')) {
        const pick = v.replace('asian handicap:', '').trim()
        const handicapMatch = pick.match(/([+-]?\d+\.?\d*)/)
        if (!handicapMatch) return 'LOST'
        const handicap = parseFloat(handicapMatch[1])
        if (pick.includes(home)) {
            const adjusted = homeScore + handicap
            if (adjusted > awayScore) return 'WON'
            if (adjusted === awayScore) return 'DRAW'
            return 'LOST'
        }
        if (pick.includes(away)) {
            const adjusted = awayScore + handicap
            if (adjusted > homeScore) return 'WON'
            if (adjusted === homeScore) return 'DRAW'
            return 'LOST'
        }
        return 'LOST'
    }

    // ── First Goal ────────────────────────────────────────────────────────────
    // Void — no scorer timeline data available
    if (v.startsWith('first goal:')) return 'DRAW'

    // ── Clean Sheet ───────────────────────────────────────────────────────────
    // "Clean Sheet: Home" | "Clean Sheet: Away" | "Clean Sheet: Neither"
    if (v.startsWith('clean sheet:')) {
        const pick = v.replace('clean sheet:', '').trim()
        if (pick === 'home') return awayScore === 0 ? 'WON' : 'LOST'
        if (pick === 'away') return homeScore === 0 ? 'WON' : 'LOST'
        if (pick === 'neither') return (homeScore > 0 && awayScore > 0) ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Draw No Bet ───────────────────────────────────────────────────────────
    // "Draw No Bet: Bayern" | "Draw No Bet: Man City"
    // If draw → void (DRAW). If picked team wins → WON. If picked team loses → LOST.
    if (v.startsWith('draw no bet:')) {
        const pick = v.replace('draw no bet:', '').trim()
        if (isDraw) return 'DRAW' // stake refunded
        if (pick.includes(home)) return homeWon ? 'WON' : 'LOST'
        if (pick.includes(away)) return awayWon ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── BTTS & Win ────────────────────────────────────────────────────────────
    // "BTTS & Win: Bayern & BTTS" | "BTTS & Win: Man City & BTTS"
    if (v.startsWith('btts & win:')) {
        const pick = v.replace('btts & win:', '').trim()
        const bothScored = homeScore > 0 && awayScore > 0
        if (!bothScored) return 'LOST'
        if (pick.includes(home)) return homeWon ? 'WON' : 'LOST'
        if (pick.includes(away)) return awayWon ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Odd/Even Goals ────────────────────────────────────────────────────────
    // "Odd/Even Goals: Odd" | "Odd/Even Goals: Even"
    if (v.startsWith('odd/even goals:')) {
        const pick = v.replace('odd/even goals:', '').trim()
        const isEven = totalGoals % 2 === 0
        if (pick === 'even') return isEven ? 'WON' : 'LOST'
        if (pick === 'odd') return !isEven ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Multi-Goals ───────────────────────────────────────────────────────────
    // "Multi-Goals: 2-4" | "Multi-Goals: 1-2" | "Multi-Goals: 3-4"
    if (v.startsWith('multi-goals:')) {
        const pick = v.replace('multi-goals:', '').trim()
        const rangeMatch = pick.match(/(\d+)\s*[-]\s*(\d+)/)
        if (!rangeMatch) return 'LOST'
        const low = parseInt(rangeMatch[1])
        const high = parseInt(rangeMatch[2])
        return (totalGoals >= low && totalGoals <= high) ? 'WON' : 'LOST'
    }

    // ── Both Halves Over 0.5 ──────────────────────────────────────────────────
    // "Both Halves Over 0.5: Yes" | "Both Halves Over 0.5: No"
    // ⚠️ We don't have HT scores — void
    if (v.startsWith('both halves over 0.5:')) return 'DRAW'

    // ── Win to Nil ────────────────────────────────────────────────────────────
    // "Win to Nil: Bayern" | "Win to Nil: Man City"
    if (v.startsWith('win to nil:')) {
        const pick = v.replace('win to nil:', '').trim()
        if (pick.includes(home)) return (homeWon && awayScore === 0) ? 'WON' : 'LOST'
        if (pick.includes(away)) return (awayWon && homeScore === 0) ? 'WON' : 'LOST'
        return 'LOST'
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
    return 'LOST'
}

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: pending, error } = await supabase
        .from('predictions')
        .select('id, match_id, verdict, home_team, away_team, match_date')
        .is('result', null)
        .gte('match_date', sevenDaysAgo)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!pending || pending.length === 0) return NextResponse.json({ updated: 0, message: 'No pending predictions' })

    const matchIds = [...new Set(pending.map(p => p.match_id))]

    let updated = 0
    const results: Record<number, { homeScore: number; awayScore: number; status: string }> = {}

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
            await new Promise(r => setTimeout(r, 300))
        } catch {
            continue
        }
    }

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