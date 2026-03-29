'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    async function handleSubmit() {
        setLoading(true)
        setError('')
        setSuccess('')
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email, password,
                    options: { data: { full_name: name } }
                })
                if (error) throw error
                router.push('/')
            } else if (mode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                router.push('/')
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                })
                if (error) throw error
                setSuccess('Reset link sent! Check your inbox.')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#050508' }}>

            {/* ── Animated background ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid lines */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(rgba(22,163,74,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(22,163,74,0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }} />

                {/* Big glow orbs */}
                <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
                    animation: 'float1 8s ease-in-out infinite',
                }} />
                <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
                    animation: 'float2 10s ease-in-out infinite',
                }} />
                <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)',
                    animation: 'float1 12s ease-in-out infinite reverse',
                }} />

                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.015]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px',
                }} />
            </div>

            {/* ── Hero section ── */}
            <div className={`relative z-10 flex flex-col items-center justify-center pt-16 pb-10 px-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

                {/* Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-8" style={{
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.2)',
                }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-[10px] font-black uppercase tracking-[0.2em]">AI-Powered Predictions</span>
                </div>

                {/* Logo mark */}
                <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl relative" style={{
                        background: 'linear-gradient(135deg, #0f4c23 0%, #166534 50%, #15803d 100%)',
                        border: '1px solid rgba(74,222,128,0.15)',
                        boxShadow: '0 0 40px rgba(22,163,74,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}>
                        ⚽
                        {/* Corner accent */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                        }} />
                    </div>
                </div>

                {/* Brand name */}
                <h1 className="font-display font-black text-3xl tracking-tight text-white mb-1">
                    Naija<span style={{ color: '#22c55e' }}>Bet</span>AI
                </h1>
                <p className="text-slate-500 text-xs tracking-widest uppercase font-bold">More Wins. Every Match.</p>

                {/* Stats strip */}
                <div className="flex gap-6 mt-8">
                    {[
                        { value: '78%', label: 'Win Rate' },
                        { value: '15+', label: 'Markets' },
                        { value: '22', label: 'Leagues' },
                    ].map(s => (
                        <div key={s.label} className="flex flex-col items-center gap-0.5">
                            <span className="font-display font-black text-xl text-white">{s.value}</span>
                            <span className="text-slate-600 text-[9px] uppercase tracking-wider font-bold">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Form card ── */}
            <div className={`relative z-10 flex-1 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="mx-4 rounded-3xl overflow-hidden" style={{
                    background: 'linear-gradient(180deg, #0d0d14 0%, #080810 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
                }}>

                    {/* Mode tabs */}
                    {mode !== 'forgot' && (
                        <div className="flex p-1.5 mx-4 mt-4 rounded-2xl gap-1" style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            {(['signin', 'signup'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => { setMode(m); setError('') }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200"
                                    style={mode === m ? {
                                        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                        color: '#fff',
                                        boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                                    } : {
                                        color: '#4b5563',
                                    }}
                                >
                                    {m === 'signin' ? 'Sign In' : 'Sign Up'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Back button for forgot mode */}
                    {mode === 'forgot' && (
                        <div className="px-5 pt-5">
                            <button
                                onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
                                className="flex items-center gap-2 text-slate-500 text-xs font-bold"
                            >
                                <span>←</span> Back to Sign In
                            </button>
                        </div>
                    )}

                    {/* Form heading */}
                    <div className="px-5 pt-5 pb-4">
                        <h2 className="font-display font-black text-xl text-white leading-tight">
                            {mode === 'signup' ? 'Join the winners' :
                                mode === 'forgot' ? 'Reset your password' :
                                    'Welcome back'}
                        </h2>
                        <p className="text-slate-600 text-xs mt-0.5">
                            {mode === 'signup' ? 'Start with AI-powered football predictions' :
                                mode === 'forgot' ? "We'll send a reset link to your email" :
                                    'Your predictions are waiting'}
                        </p>
                    </div>

                    {/* Fields */}
                    <div className="px-5 pb-6 space-y-3">

                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <label className="text-slate-600 text-[10px] uppercase tracking-[0.12em] font-black block">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Samuel Echi"
                                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                    onFocus={e => {
                                        e.target.style.border = '1px solid rgba(34,197,94,0.4)'
                                        e.target.style.background = 'rgba(22,163,74,0.04)'
                                    }}
                                    onBlur={e => {
                                        e.target.style.border = '1px solid rgba(255,255,255,0.07)'
                                        e.target.style.background = 'rgba(255,255,255,0.03)'
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-slate-600 text-[10px] uppercase tracking-[0.12em] font-black block">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@gmail.com"
                                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                }}
                                onFocus={e => {
                                    e.target.style.border = '1px solid rgba(34,197,94,0.4)'
                                    e.target.style.background = 'rgba(22,163,74,0.04)'
                                }}
                                onBlur={e => {
                                    e.target.style.border = '1px solid rgba(255,255,255,0.07)'
                                    e.target.style.background = 'rgba(255,255,255,0.03)'
                                }}
                            />
                        </div>

                        {mode !== 'forgot' && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-slate-600 text-[10px] uppercase tracking-[0.12em] font-black block">
                                        Password
                                    </label>
                                    {mode === 'signin' && (
                                        <button
                                            onClick={() => { setMode('forgot'); setError('') }}
                                            className="text-green-500 text-[10px] font-black uppercase tracking-wider"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                    onFocus={e => {
                                        e.target.style.border = '1px solid rgba(34,197,94,0.4)'
                                        e.target.style.background = 'rgba(22,163,74,0.04)'
                                    }}
                                    onBlur={e => {
                                        e.target.style.border = '1px solid rgba(255,255,255,0.07)'
                                        e.target.style.background = 'rgba(255,255,255,0.03)'
                                    }}
                                />
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{
                                background: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.15)',
                            }}>
                                <span className="text-red-400 text-sm">⚠</span>
                                <p className="text-red-400 text-xs">{error}</p>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{
                                background: 'rgba(34,197,94,0.06)',
                                border: '1px solid rgba(34,197,94,0.15)',
                            }}>
                                <span className="text-green-400 text-sm">✓</span>
                                <p className="text-green-400 text-xs">{success}</p>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full font-black py-4 rounded-2xl text-sm tracking-widest uppercase text-white active:scale-95 transition-all duration-150 disabled:opacity-40 mt-1 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)',
                                boxShadow: loading ? 'none' : '0 8px 32px rgba(22,163,74,0.3), 0 2px 8px rgba(0,0,0,0.3)',
                            }}
                        >
                            {/* Shimmer effect */}
                            {!loading && (
                                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300" style={{
                                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                                }} />
                            )}
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Please wait...
                                </span>
                            ) : mode === 'signup' ? 'Create Account →' :
                                mode === 'forgot' ? 'Send Reset Link →' :
                                    'Sign In →'}
                        </button>

                        {/* Trust badges */}
                        {mode === 'signin' && (
                            <div className="flex items-center justify-center gap-4 pt-2">
                                {['🔒 Secure', '🇳🇬 Nigerian', '⚡ Instant'].map(b => (
                                    <span key={b} className="text-slate-700 text-[9px] font-bold uppercase tracking-wider">{b}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom padding */}
                <div className="h-10" />
            </div>

            <style jsx global>{`
                @keyframes float1 {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(15px) scale(0.95); }
                }
            `}</style>
        </main>
    )
}