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
            <div className="flex flex-col min-h-screen items-center justify-center gap-4"
                style={{ background: '#0A0A0F' }}>
                <div className="w-10 h-10 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading history...</p>
            </div>
        )
    }

    return (
        <main className="flex flex-col min-h-screen" style={{ background: '#0A0A0F' }}>

            {/* Header */}
            <div className="relative pt-14 pb-5 px-5 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-36 rounded-full blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)' }} />

                <h1 className="text-white font-black text-xl font-display relative mb-4">Prediction History</h1>

                {/* Stats */}
                <div className={`flex gap-2.5 relative transition-all ${isPro === false ? 'blur-sm pointer-events-none select-none' : ''}`}>
                    {[
                        { label: 'Total Tips', value: `${history.length}` },
                        { label: 'Won', value: `${won}`, accent: true },
                        { label: 'Win Rate', value: total > 0 ? `${winRate}%` : '—', accent: true },
                    ].map(s => (
                        <div key={s.label} className="flex-1 rounded-2xl px-3 py-3"
                            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{s.label}</p>
                            <p className={`font-black text-xl leading-none font-display ${s.accent ? 'text-green-400' : 'text-white'}`}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="mx-5 mb-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

            {/* List */}
            <div className="flex-1 px-5 pb-28 space-y-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 pt-20">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                            📭
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold mb-1">No predictions yet</p>
                            <p className="text-slate-500 text-xs leading-relaxed max-w-50">
                                View a match prediction and it will appear here automatically.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="text-green-400 text-sm font-bold mt-1 flex items-center gap-1"
                        >
                            Browse Matches
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">Recent Tips</span>
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                        </div>

                        {visibleHistory.map(item => (
                            <HistoryCard key={item.id} item={item} />
                        ))}

                        {lockedHistory.length > 0 && (
                            <div className="relative">
                                <div className="space-y-3 pointer-events-none select-none" style={{ filter: 'blur(5px)', opacity: 0.35 }}>
                                    {lockedHistory.map(item => (
                                        <HistoryCard key={item.id} item={item} />
                                    ))}
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6">
                                    <div className="rounded-2xl p-5 w-full flex flex-col items-center gap-4 text-center"
                                        style={{
                                            background: '#111118',
                                            border: '1px solid rgba(34,197,94,0.2)',
                                            boxShadow: '0 0 40px rgba(22,163,74,0.12)',
                                        }}>
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                                            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                            🔒
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-base font-display">
                                                {lockedHistory.length} tips locked
                                            </p>
                                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                                                Upgrade to <span className="text-green-400 font-bold">Pro</span> to unlock full prediction history, win stats & all AI tips.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => router.push('/subscribe')}
                                            className="w-full font-black text-sm py-3.5 rounded-xl text-white active:scale-95 transition-all"
                                            style={{
                                                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                                boxShadow: '0 0 20px rgba(34,197,94,0.2)',
                                            }}
                                        >
                                            Upgrade to Pro →
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
    )
}

function HistoryCard({ item }: { item: HistoryItem }) {
    const date = item.match_date
        ? new Date(item.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : '—'

    const resultStyle = item.result === 'WON'
        ? { color: '#4ade80', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }
        : item.result === 'LOST'
            ? { color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
            : { color: '#64748b', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }

    return (
        <div className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                    {date} · {item.competition}
                </span>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-lg" style={resultStyle}>
                    {item.result || 'PENDING'}
                </span>
            </div>

            <p className="text-white text-sm font-bold mb-3 leading-tight">
                {item.home_team} <span className="text-slate-600">vs</span> {item.away_team}
            </p>

            <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5"
                    style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span className="text-xs">🤖</span>
                    <span className="text-green-400 text-[10px] font-bold">{item.verdict}</span>
                </div>
                {item.prediction_data?.bestBetOdds && (
                    <span className="text-amber-400 text-xs font-black">{item.prediction_data.bestBetOdds}</span>
                )}
            </div>
        </div>
    )
}