import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendNotification } from '@/app/api/notifications/send/route'

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

    if (v.startsWith('1x2:')) {
        const pick = v.replace('1x2:', '').trim()
        if (pick === 'draw') return isDraw ? 'WON' : 'LOST'
        if (pick.includes(home)) return homeWon ? 'WON' : 'LOST'
        if (pick.includes(away)) return awayWon ? 'WON' : 'LOST'
        return 'LOST'
    }

    if (v.startsWith('btts:') && !v.startsWith('btts & win')) {
        const pick = v.replace('btts:', '').trim()
        const bothScored = homeScore > 0 && awayScore > 0
        if (pick === 'yes') return bothScored ? 'WON' : 'LOST'
        if (pick === 'no') return !bothScored ? 'WON' : 'LOST'
        return 'LOST'
    }

    if (v.startsWith('over/under:')) {
        const pick = v.replace('over/under:', '').trim()
        const lineMatch = pick.match(/(\d+\.?\d*)/)
        if (!lineMatch) return 'LOST'
        const line = parseFloat(lineMatch[1])
        if (pick.startsWith('over')) return totalGoals > line ? 'WON' : 'LOST'
        if (pick.startsWith('under')) return totalGoals < line ? 'WON' : 'LOST'
        return 'LOST'
    }

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

    if (v.startsWith('correct score:')) {
        const pick = v.replace('correct score:', '').trim()
        const scoreMatch = pick.match(/(\d+)\s*[-:]\s*(\d+)/)
        if (!scoreMatch) return 'LOST'
        const predHome = parseInt(scoreMatch[1])
        const predAway = parseInt(scoreMatch[2])
        return (homeScore === predHome && awayScore === predAway) ? 'WON' : 'LOST'
    }

    if (v.startsWith('ht/ft:')) return 'DRAW'

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

    if (v.startsWith('first goal:')) return 'DRAW'

    if (v.startsWith('clean sheet:')) {
        const pick = v.replace('clean sheet:', '').trim()
        if (pick === 'home') return awayScore === 0 ? 'WON' : 'LOST'
        if (pick === 'away') return homeScore === 0 ? 'WON' : 'LOST'
        if (pick === 'neither') return (homeScore > 0 && awayScore > 0) ? 'WON' : 'LOST'
        return 'LOST'
    }

    if (v.startsWith('draw no bet:')) {
        const pick = v.replace('draw no bet:', '').trim()
        if (isDraw) return 'DRAW'
        if (pick.includes(home)) return homeWon ? 'WON' : 'LOST'
        if (pick.includes(away)) return awayWon ? 'WON' : 'LOST'
        return 'LOST'
    }

    if (v.startsWith('btts & win:')) {
        const pick = v.replace('btts & win:', '').trim()
        const bothScored = homeScore > 0 && awayScore > 0
        if (!bothScored) return 'LOST'
        if (pick.includes(home)) return homeWon ? 'WON' : 'LOST'
        if (pick.includes(away)) return awayWon ? 'WON' : 'LOST'
        return 'LOST'
    }

    if (v.startsWith('odd/even goals:')) {
        const pick = v.replace('odd/even goals:', '').trim()
        const isEven = totalGoals % 2 === 0
        if (pick === 'even') return isEven ? 'WON' : 'LOST'
        if (pick === 'odd') return !isEven ? 'WON' : 'LOST'
        return 'LOST'
    }

    if (v.startsWith('multi-goals:')) {
        const pick = v.replace('multi-goals:', '').trim()
        const rangeMatch = pick.match(/(\d+)\s*[-]\s*(\d+)/)
        if (!rangeMatch) return 'LOST'
        const low = parseInt(rangeMatch[1])
        const high = parseInt(rangeMatch[2])
        return (totalGoals >= low && totalGoals <= high) ? 'WON' : 'LOST'
    }

    if (v.startsWith('both halves over 0.5:')) return 'DRAW'

    if (v.startsWith('win to nil:')) {
        const pick = v.replace('win to nil:', '').trim()
        if (pick.includes(home)) return (homeWon && awayScore === 0) ? 'WON' : 'LOST'
        if (pick.includes(away)) return (awayWon && homeScore === 0) ? 'WON' : 'LOST'
        return 'LOST'
    }

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
        .select('id, match_id, verdict, home_team, away_team, match_date, user_id')
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

    // Track wins per user for notifications
    const userWins: Record<string, { count: number; match: string }> = {}

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

        // Track wins for notifications
        if (outcome === 'WON' && prediction.user_id) {
            if (!userWins[prediction.user_id]) {
                userWins[prediction.user_id] = {
                    count: 0,
                    match: `${prediction.home_team} vs ${prediction.away_team}`
                }
            }
            userWins[prediction.user_id].count++
        }
    }

    // Send win notifications
    const winnerIds = Object.keys(userWins)
    if (winnerIds.length > 0) {
        const winMessages = [
            (match: string, count: number) => ({
                title: "🎉 Your Tip Won!",
                message: count > 1
                    ? `${count} of your predictions came in today! Keep riding the streak 💰`
                    : `Your pick on ${match} came in! The AI doesn't miss 🔥`
            }),
            (match: string, count: number) => ({
                title: "💰 Prediction Hit!",
                message: count > 1
                    ? `${count} winning tips today. NaijaBetAI is built different 🧠`
                    : `${match} — your tip landed! Check your results 🎯`
            }),
        ]

        for (const userId of winnerIds) {
            const { count, match } = userWins[userId]
            const msgTemplate = winMessages[Math.floor(Math.random() * winMessages.length)]
            const { title, message } = msgTemplate(match, count)

            await sendNotification({
                title,
                message,
                userIds: [userId],
                url: 'https://naijabetai.com/history'
            })

            await new Promise(r => setTimeout(r, 200))
        }
    }

    return NextResponse.json({
        updated,
        total: pending.length,
        winnersNotified: winnerIds.length,
        message: `Updated ${updated} predictions, notified ${winnerIds.length} winners`
    })
}