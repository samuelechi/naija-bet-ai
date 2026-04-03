'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function StripeCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const sessionId = searchParams.get('session_id')
        verify(sessionId)
    }, [searchParams])

    async function verify(sessionId: string | null) {
        if (!sessionId) {
            setStatus('failed')
            setMessage('No session found.')
            return
        }

        try {
            await new Promise(r => setTimeout(r, 1500))

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/login')
                return
            }

            // Poll Supabase for up to 10 seconds waiting for webhook to fire
            let attempts = 0
            while (attempts < 10) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', session.user.id)
                    .single()

                if (profile?.plan === 'pro') {
                    setStatus('success')
                    setTimeout(() => router.push('/'), 2500)
                    return
                }

                attempts++
                await new Promise(r => setTimeout(r, 1000))
            }

            setStatus('failed')
            setMessage('Payment received but activation is taking longer than expected. Please contact support or refresh the app.')
        } catch {
            setStatus('failed')
            setMessage('Something went wrong. Please try again.')
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ background: '#0A0A0F' }}>

            {status === 'verifying' && (
                <div className="flex flex-col items-center gap-5 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: '#111118', border: '1px solid rgba(34,197,94,0.2)' }}>
                            💳
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
                    </div>
                    <div>
                        <p className="text-white font-black text-lg font-display">Activating Your Pro Plan</p>
                        <p className="text-slate-500 text-sm mt-1">Please wait, do not close this page...</p>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                        style={{
                            background: 'linear-gradient(135deg, #166534, #15803d)',
                            border: '1px solid rgba(74,222,128,0.25)',
                            boxShadow: '0 0 40px rgba(22,163,74,0.3)',
                        }}>
                        ✅
                    </div>
                    <div>
                        <p className="text-white font-black text-xl font-display">You're now Pro! 🎉</p>
                        <p className="text-slate-400 text-sm mt-1">Redirecting you to predictions...</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-xs font-bold uppercase tracking-widest">PRO · Active</span>
                    </div>
                </div>
            )}

            {status === 'failed' && (
                <div className="flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ❌
                    </div>
                    <div>
                        <p className="text-white font-black text-lg font-display">Activation Failed</p>
                        <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-xs">{message}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <button
                            onClick={() => router.push('/subscribe')}
                            className="w-full font-black text-sm py-3.5 rounded-xl text-white active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                        >
                            Try Again
                        </button>
                        <button onClick={() => router.push('/')} className="text-slate-500 text-xs py-2">
                            Go to Home
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default function StripeCallbackPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
                <div className="w-8 h-8 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
            </main>
        }>
            <StripeCallback />
        </Suspense>
    )
}