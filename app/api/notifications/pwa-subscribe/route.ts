import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { subscription, userId } = await request.json()

        if (!subscription || !userId) {
            return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('pwa_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            }, { onConflict: 'endpoint' })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('PWA subscribe error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}