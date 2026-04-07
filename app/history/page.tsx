'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { supabase } from '@/lib/supabase'

const FREE_VISIBLE = 2

type HistoryItem = {
    id: string
    home_team: string
    away_team: string
    competition: string
    verdict: string
    match_date: string
    result: string | null
    prediction_data: { bestBetOdds?: string }
}

export default function HistoryPage() {
    const router = useRouter()
    const [isPro, setIsPro] = useState<boolean | null>(null)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setIsPro(false); setLoading(false); return }

            const { data: profile } = await supabase
                .from('profiles').select('plan').eq('id', user.id).single()

            setIsPro(profile?.plan === 'pro')

            const { data: rows } = await supabase
                .from('predictions')
                .select('id, home_team, away_team, competition, verdict, match_date, result, prediction_data')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            setHistory(rows ?? [])
            setLoading(false)
        }
        load()
    }, [])

    const visibleHistory = isPro ? history : history.slice(0, FREE_VISIBLE)
    const lockedHistory = isPro ? [] : history.slice(FREE_VISIBLE)

    const won = history.filter(h => h.result === 'WON').length
    const total = history.filter(h => h.result !== null).length
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0

    if (loading) {
        return (
            <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: '#0A0A0F' }}>
                <div className="flex flex-col min-h-screen items-center justify-center gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-12 h-12 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Database...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: '#0A0A0F' }}>
            <main className="flex flex-col min-h-screen relative overflow-hidden">

                {/* Immersive Background Glow */}
                <div className="absolute top-0 left-0 right-0 h-96 pointer-events-none opacity-40"
                    style={{ background: 'radial-gradient(100% 100% at 50% 0%, rgba(34,197,94,0.1) 0%, rgba(10,10,15,0) 100%)' }} />

                {/* Header */}
                <div className="relative pt-14 pb-5 px-5 z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            📊
                        </div>
                        <div>
                            <h1 className="text-white font-black text-lg tracking-tight leading-none mb-1">Prediction History</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Your AI Tracker</p>
                        </div>
                    </div>

                    {/* Glassmorphic Stats Row */}
                    <div className={`flex gap-3 relative transition-all ${isPro === false ? 'opacity-80' : ''}`}>
                        {[
                            { label: 'Total Tips', value: `${history.length}`, highlight: false },
                            { label: 'Won', value: `${won}`, highlight: true },
                            { label: 'Win Rate', value: total > 0 ? `${winRate}%` : '—', highlight: true },
                        ].map(s => (
                            <div key={s.label} className="flex-1 relative overflow-hidden rounded-2xl px-3 py-3.5"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                                }}>
                                {s.highlight && (
                                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500/10 rounded-full blur-xl" />
                                )}
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1 relative z-10">{s.label}</p>
                                <p className={`font-black text-xl leading-none relative z-10 ${s.highlight ? 'text-green-400' : 'text-white'}`}>
                                    {s.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mx-5 mb-4 h-px relative z-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

                {/* History List */}
                <div className="flex-1 px-5 pb-28 space-y-4 overflow-y-auto z-10 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-5 pt-16 opacity-60">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" />
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    📭
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-black tracking-wide mb-1.5 text-sm">No predictions yet</p>
                                <p className="text-slate-500 text-xs font-medium max-w-[200px] mx-auto leading-relaxed mb-4">
                                    View a match prediction and it will automatically be saved here.
                                </p>
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-green-400 border border-green-500/30 bg-green-500/10 active:scale-95 transition-transform"
                                >
                                    Browse Matches
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Recent Activity</span>
                                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                            </div>

                            {visibleHistory.map(item => (
                                <HistoryCard key={item.id} item={item} />
                            ))}

                            {/* Pro Paywall Overlay */}
                            {lockedHistory.length > 0 && (
                                <div className="relative mt-2">
                                    <div className="space-y-4 pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.4 }}>
                                        {lockedHistory.map(item => (
                                            <HistoryCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center px-2 py-4">
                                        <div className="rounded-3xl p-6 w-full flex flex-col items-center gap-4 text-center relative overflow-hidden"
                                            style={{
                                                background: 'rgba(10,10,15,0.8)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(34,197,94,0.3)',
                                                boxShadow: '0 20px 40px -10px rgba(22,163,74,0.2)'
                                            }}>
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />

                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                                                style={{ background: 'linear-gradient(135deg, #166534, #15803d)', border: '1px solid rgba(74,222,128,0.4)' }}>
                                                🔒
                                            </div>
                                            <div>
                                                <p className="text-white font-black text-lg tracking-tight">{lockedHistory.length} Tips Locked</p>
                                                <p className="text-slate-400 text-xs mt-2 leading-relaxed px-2">
                                                    Upgrade to <span className="text-green-400 font-bold">Pro</span> to unlock your full betting history, advanced win stats, and all AI insights.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => router.push('/subscribe')}
                                                className="w-full mt-2 font-black text-sm py-3.5 rounded-xl text-white active:scale-95 transition-transform"
                                                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
                                            >
                                                Unlock Pro Access →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <BottomNav active="history" />
            </main>
        </div>
    )
}

function HistoryCard({ item }: { item: HistoryItem }) {
    const date = item.match_date
        ? new Date(item.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : '—'

    // Dynamic styling based on result
    const statusTheme = item.result === 'WON'
        ? { color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', glow: 'rgba(34,197,94,0.1)' }
        : item.result === 'LOST'
            ? { color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', glow: 'rgba(239,68,68,0.1)' }
            : item.result === 'DRAW'
                ? { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)', glow: 'transparent' }
                : { color: '#64748b', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', glow: 'transparent' } // PENDING

    return (
        <div className="group relative rounded-3xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
                background: 'linear-gradient(180deg, rgba(17,17,24,0.8) 0%, rgba(10,10,15,1) 100%)',
                border: `1px solid ${statusTheme.border}`,
                boxShadow: `0 10px 30px -15px ${statusTheme.glow}`
            }}>

            {/* Subtle Top Glow matching result */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 rounded-full blur-2xl pointer-events-none opacity-50"
                style={{ background: statusTheme.glow }} />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                    <span className="text-slate-400">{date}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    {item.competition}
                </span>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest"
                    style={{ color: statusTheme.color, background: statusTheme.bg, border: `1px solid ${statusTheme.border}` }}>
                    {item.result || 'PENDING'}
                </span>
            </div>

            <p className="text-white text-[13px] font-black mb-4 leading-tight tracking-wide relative z-10">
                {item.home_team} <span className="text-slate-600 mx-1 font-medium italic text-xs">vs</span> {item.away_team}
            </p>

            <div className="flex items-center justify-between pt-3 relative z-10"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs opacity-80">🤖</span>
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">{item.verdict}</span>
                </div>
                {item.prediction_data?.bestBetOdds && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Odds</span>
                        <span className="text-amber-400 text-xs font-black bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                            {item.prediction_data.bestBetOdds}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}