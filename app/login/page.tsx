'use client'

import { useState } from 'react'
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
                setSuccess('Password reset email sent! Check your inbox.')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const inputClass = `
        w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none
        transition-all duration-200
        focus:border-green-500 focus:ring-1 focus:ring-green-500/30
    `

    return (
        <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0A0A0F' }}>

            {/* Background image */}
            <div
                className="absolute top-0 left-0 right-0 h-[58vh]"
                style={{
                    backgroundImage: "url('/bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                }}
            />

            {/* Gradient overlays */}
            <div className="absolute top-0 left-0 right-0 h-[58vh]"
                style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.0) 40%, rgba(10,10,15,1) 100%)' }} />
            <div className="absolute top-0 left-0 right-0 h-[58vh]"
                style={{ background: 'linear-gradient(180deg, transparent 50%, #0A0A0F 100%)' }} />

            {/* Content */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Logo over image */}
                <div className="h-[52vh] flex flex-col items-center justify-end pb-8 px-5">
                    <div className="flex flex-col items-center gap-3">


                    </div>
                </div>

                {/* Form card */}
                <div className="flex-1 px-5 pt-6 pb-10">
                    <div className="mb-6">
                        <h2 className="text-white font-black text-2xl font-display leading-tight">
                            {mode === 'signup' ? 'Create Account' :
                                mode === 'forgot' ? 'Reset Password' :
                                    'Welcome Back'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {mode === 'signup' ? 'Start winning with AI predictions' :
                                mode === 'forgot' ? 'Enter your email to reset password' :
                                    'Sign in to continue'}
                        </p>
                    </div>

                    <div className="space-y-3">

                        {mode === 'signup' && (
                            <div>
                                <label className="text-slate-500 text-[10px] uppercase tracking-[0.12em] font-bold block mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Samuel Echi"
                                    className={inputClass}
                                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-slate-500 text-[10px] uppercase tracking-[0.12em] font-bold block mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@gmail.com"
                                className={inputClass}
                                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
                            />
                        </div>

                        {mode !== 'forgot' && (
                            <div>
                                <label className="text-slate-500 text-[10px] uppercase tracking-[0.12em] font-bold block mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={inputClass}
                                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                            </div>
                        )}

                        {mode === 'signin' && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => { setMode('forgot'); setError('') }}
                                    className="text-green-400 text-xs font-bold"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-xl px-4 py-3"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <p className="text-red-400 text-xs">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="rounded-xl px-4 py-3"
                                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <p className="text-green-400 text-xs">{success}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full font-black py-4 rounded-2xl text-base tracking-wide text-white active:scale-95 transition-all duration-150 disabled:opacity-50 mt-2"
                            style={{
                                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                boxShadow: loading ? 'none' : '0 0 24px rgba(34,197,94,0.25)',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Please wait...
                                </span>
                            ) : mode === 'signup' ? 'Create Account' :
                                mode === 'forgot' ? 'Send Reset Email' :
                                    'Sign In'}
                        </button>

                        {mode !== 'forgot' ? (
                            <button
                                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                                className="w-full text-center text-slate-500 text-sm py-2"
                            >
                                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                                <span className="text-green-400 font-bold">
                                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
                                className="w-full text-center text-slate-500 text-sm py-2"
                            >
                                ← Back to <span className="text-green-400 font-bold">Sign In</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}