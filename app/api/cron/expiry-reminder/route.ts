import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendNotification } from '@/app/api/notifications/send/route'

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Find users whose Pro plan expires in exactly 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const dateStr = threeDaysFromNow.toISOString().split('T')[0]

    const { data: expiringUsers, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('plan', 'pro')
        .eq('subscription_status', 'active')
        .gte('subscription_expiry', dateStr + 'T00:00:00')
        .lt('subscription_expiry', dateStr + 'T23:59:59')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!expiringUsers || expiringUsers.length === 0) {
        return NextResponse.json({ notified: 0, message: 'No expiring users' })
    }

    let notified = 0
    for (const user of expiringUsers) {
        await sendNotification({
            title: '⚠️ Your Pro Plan Expires Soon!',
            message: 'You have 3 days left on Pro. Renew now to keep your edge and never miss a winning tip 🔒',
            userIds: [user.id],
            url: 'https://naijabetai.com/subscribe'
        })
        notified++
        await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ notified, message: `Notified ${notified} expiring users` })
}