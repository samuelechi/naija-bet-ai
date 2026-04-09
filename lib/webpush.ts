import webpush from 'web-push'

webpush.setVapidDetails(
    process.env.VAPID_MAILTO!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

export async function sendWebPush(
    subscription: webpush.PushSubscription,
    payload: { title: string; message: string; url?: string }
) {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        return true
    } catch (err: any) {
        // Subscription expired or invalid — caller should delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
            return 'expired'
        }
        console.error('Web push error:', err)
        return false
    }
}