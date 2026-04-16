import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendWebPush } from '@/lib/webpush'

const ONESIGNAL_APP_ID = '98c9ac96-ee4b-437e-88ea-096a9f2ce545'
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!

interface SendNotificationParams {
    title: string
    message: string
    userIds?: string[]
    url?: string
}

async function sendToOneSignal({ title, message, userIds, url }: SendNotificationParams) {
    const body: Record<string, any> = {
        app_id: ONESIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        ...(url && { url }),
    }

    if (userIds && userIds.length > 0) {
        body.include_aliases = { external_id: userIds }
        body.target_channel = 'push'
    } else {
        body.included_segments = ['All']
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()
    console.log('OneSignal response:', data)
    return data
}

async function sendToPWA({ title, message, userIds, url }: SendNotificationParams) {
    const supabase = getSupabaseAdmin()

    // Fetch subscriptions — either for specific users or all
    const query = supabase
        .from('pwa_subscriptions')
        .select('*')

    if (userIds && userIds.length > 0) {
        query.in('user_id', userIds)
    }

    const { data: subs, error } = await query
    if (error || !subs || subs.length === 0) return { sent: 0, expired: 0 }

    let sent = 0
    let expired = 0
    const expiredEndpoints: string[] = []

    for (const sub of subs) {
        const result = await sendWebPush(
            {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            { title, message, url }
        )

        if (result === true) {
            sent++
        } else if (result === 'expired') {
            expired++
            expiredEndpoints.push(sub.endpoint)
        }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
        await supabase
            .from('pwa_subscriptions')
            .delete()
            .in('endpoint', expiredEndpoints)
    }

    return { sent, expired }
}

// Removed the 'export' keyword here to satisfy Vercel/Next.js strict build rules
async function sendNotification({ title, message, userIds, url }: SendNotificationParams) {
    const [oneSignalResult, pwaResult] = await Promise.all([
        sendToOneSignal({ title, message, userIds, url }),
        sendToPWA({ title, message, userIds, url }),
    ])

    console.log('PWA push result:', pwaResult)
    return { oneSignal: oneSignalResult, pwa: pwaResult }
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, message, userIds, url } = await req.json()

    if (!title || !message) {
        return NextResponse.json({ error: 'Missing title or message' }, { status: 400 })
    }

    const result = await sendNotification({ title, message, userIds, url })
    return NextResponse.json({ success: true, result })
}