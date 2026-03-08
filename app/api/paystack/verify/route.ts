import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const { reference, userId } = await req.json()

        if (!reference || !userId) {
            return NextResponse.json({ error: 'Missing reference or userId' }, { status: 400 })
        }

        // Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        })

        const data = await response.json()

        if (!data.status || data.data.status !== 'success') {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
        }

        const tx = data.data

        // Calculate subscription expiry (30 days from now)
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)

        // Update Supabase profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan: 'pro',
                subscription_status: 'active',
                subscription_expiry: expiry.toISOString(),
                paystack_customer_code: tx.customer?.customer_code ?? null,
                paystack_subscription_code: tx.plan_object?.plan_code ?? null,
            })
            .eq('id', userId)

        if (updateError) {
            console.error('Supabase update error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true, plan: 'pro' })
    } catch (err) {
        console.error('Paystack verify error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}