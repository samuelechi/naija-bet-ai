'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type) {
            supabase.auth.verifyOtp({
                type: type as any,
                token_hash,
            }).then(({ error }) => {
                if (error) {
                    setError('Reset link is invalid or has expired. Please request a new one.')
                }
                setVerifying(false)
            })
        } else {
            setVerifying(false)
            setError('Invalid reset link.')
        }
    }, [])

    async function handleReset() {
        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setTimeout(() => router.push('/'), 2500)
    }

    if (verifying) {
        return (
            <main className="min-h-screen flex items-center justify-center"
                style={{ background: '#0A0A0F' }}>
                <div className="w-8 h-8 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
            </main>
        )
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ background: '#0A0A0F' }}>
            <div className="w-full max-w-sm space-y-6">

                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        🔑
                    </div>
                    <h1 className="text-white font-black text-xl">Reset Password</h1>
                    <p className="text-slate-500 text-sm mt-1">Enter your new password below</p>
                </div>

                {success ? (
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
                            style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                            ✅
                        </div>
                        <p className="text-white font-black">Password updated!</p>
                        <p className="text-slate-500 text-sm">Redirecting you to the app...</p>
                    </div>
                ) : error && !password ? (
                    <div className="text-center space-y-4">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full font-black text-sm py-3.5 rounded-xl text-white"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none"
                                style={{
                                    background: '#111118',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="Repeat your password"
                                className="w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none"
                                style={{
                                    background: '#111118',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                        )}

                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="w-full font-black text-sm py-3.5 rounded-xl text-white active:scale-95 transition-all"
                            style={{
                                background: loading ? '#1a1a2e' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                                opacity: loading ? 0.7 : 1,
                            }}>
                            {loading ? 'Updating...' : 'Update Password →'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}