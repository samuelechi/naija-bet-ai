import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('Stripe webhook signature error:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Stripe webhook event:', event.type)

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.userId
        const email = session.customer_email

        if (!userId) {
            console.error('No userId in session metadata')
            return NextResponse.json({ error: 'No userId' }, { status: 400 })
        }

        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)

        const { error } = await supabase
            .from('profiles')
            .update({
                plan: 'pro',
                subscription_status: 'active',
                subscription_expiry: expiry.toISOString(),
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId)

        if (error) {
            console.error('Supabase update error:', error)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        console.log('Stripe Pro activated for userId:', userId)

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
                title: '🎉 Welcome to Pro!',
                message: 'Your Pro plan is now active. Unlock all 15 prediction markets and start winning 🔥',
                userIds: [userId],
                url: 'https://naijabetai.com',
            }),
        })
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer as string

        const { error } = await supabase
            .from('profiles')
            .update({
                plan: 'free',
                subscription_status: 'inactive',
            })
            .eq('stripe_customer_id', stripeCustomerId)

        if (error) {
            console.error('Supabase downgrade error:', error)
        }

        console.log('Stripe subscription cancelled for customer:', stripeCustomerId)
    }

    return NextResponse.json({ received: true })
}