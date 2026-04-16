import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Count today's matches
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .gte('match_date', today)
        .lt('match_date', today + 'T23:59:59')

    const matchCount = count ?? 0

    const messages = [
        {
            title: "🌅 Morning Predictions Are Live!",
            message: `${matchCount} matches analysed today. Your edge starts now 🎯 Don't bet blind.`
        },
        {
            title: "🔥 Today's Tips Are Ready!",
            message: `We've crunched the numbers on ${matchCount} matches. Time to get ahead of the bookies 💰`
        },
        {
            title: "⚽ Fresh Predictions Drop!",
            message: `${matchCount} AI-powered predictions live now. Smarter bets start here 🧠`
        },
    ]

    // Rotate messages daily so it doesn't feel repetitive
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const msg = messages[dayOfYear % messages.length]

    await sendNotification({
        title: msg.title,
        message: msg.message,
        url: 'https://naijabetai.com'
    })

    return NextResponse.json({ success: true, matchCount, message: msg.message })
}