import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { email, userId } = await req.json()

        if (!email || !userId) {
            return NextResponse.json({ error: 'Missing email or userId' }, { status: 400 })
        }

        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: 600000, // ₦6000 in kobo
                plan: process.env.PAYSTACK_PRO_PLAN_CODE,
                callback_url: callbackUrl,
                metadata: {
                    userId,
                    cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
                },
            }),
        })

        const data = await response.json()

        if (!data.status) {
            return NextResponse.json({ error: data.message }, { status: 400 })
        }

        return NextResponse.json({
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference,
        })
    } catch (err) {
        console.error('Paystack initialize error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}