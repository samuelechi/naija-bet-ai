import { NextRequest, NextResponse } from 'next/server'

const ONESIGNAL_APP_ID = '98c9ac96-ee4b-437e-88ea-096a9f2ce545'
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!

interface SendNotificationParams {
    title: string
    message: string
    userIds?: string[]  // specific users, or omit for all users
    url?: string
}

async function sendNotification({ title, message, userIds, url }: SendNotificationParams) {
    const body: Record<string, any> = {
        app_id: ONESIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        ...(url && { url }),
    }

    // Target specific users or broadcast to all
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

export { sendNotification }