import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
    try {
        const { email, userId } = await req.json()

        if (!email || !userId) {
            return NextResponse.json({ error: 'Missing email or userId' }, { status: 400 })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: process.env.STRIPE_PRO_PRICE_ID!,
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/stripe-callback?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        console.error('Stripe initialize error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}