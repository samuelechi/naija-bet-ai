import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()
        const signature = req.headers.get('x-paystack-signature')

        // Verify webhook signature
        const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
            .update(rawBody)
            .digest('hex')

        if (hash !== signature) {
            console.error('Invalid Paystack webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const event = JSON.parse(rawBody)
        console.log('Paystack webhook event:', event.event)

        // Only handle successful charges
        if (event.event !== 'charge.success') {
            return NextResponse.json({ received: true })
        }

        const tx = event.data
        const email = tx.customer?.email

        if (!email) {
            console.error('No email in webhook payload')
            return NextResponse.json({ error: 'No email found' }, { status: 400 })
        }

        // Find user by email
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (fetchError || !profile) {
            console.error('Profile not found for email:', email)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Calculate expiry (30 days)
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)

        // Update profile to pro
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan: 'pro',
                subscription_status: 'active',
                subscription_expiry: expiry.toISOString(),
                paystack_customer_code: tx.customer?.customer_code ?? null,
                paystack_subscription_code: tx.plan_object?.plan_code ?? null,
            })
            .eq('id', profile.id)

        if (updateError) {
            console.error('Supabase update error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        console.log('Pro plan activated for:', email)
        return NextResponse.json({ received: true })

    } catch (err) {
        console.error('Webhook error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}