'use client'
export const dynamic = 'force-static'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Match, Prediction } from '@/types'
import BottomNav from '@/components/layout/BottomNav'
import { supabase } from '@/lib/supabase'

export default function MatchDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const matchId = params.id as string

    const [match, setMatch] = useState<Match | null>(null)
    const [prediction, setPrediction] = useState<Prediction | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        const matchData = searchParams.get('match')
        if (matchData) setMatch(JSON.parse(decodeURIComponent(matchData)))
        loadPrediction()
    }, [matchId])

    async function loadPrediction() {
        setLoading(true)
        setError(null)
        try {
            const matchData = searchParams.get('match')
            const matchObj = matchData ? JSON.parse(decodeURIComponent(matchData)) : null
            if (!matchObj) { setError('Match data missing'); return }

            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`/api/predictions/${matchId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token ?? ''}`,
                },
                body: JSON.stringify({ match: matchObj }),
            })

            if (res.status === 403) { setIsLocked(true); return }
            if (!res.ok) throw new Error('Failed')
            const data = await res.json()
            setPrediction(data.prediction)
        } catch {
            setError('Failed to load prediction')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center gap-5"
                style={{ background: '#0A0A0F' }}>
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: '#111118', border: '1px solid rgba(34,197,94,0.2)' }}>
                        🤖
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-white font-bold text-sm">AI is analysing this match</p>
                    <p className="text-slate-500 text-xs mt-1">Crunching form, stats & odds...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center gap-4 px-6"
                style={{ background: '#0A0A0F' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: '#111118', border: '1px solid rgba(239,68,68,0.2)' }}>
                    ⚠️
                </div>
                <div className="text-center">
                    <p className="text-white font-bold mb-1">Something went wrong</p>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
                <button onClick={() => router.back()} className="text-green-400 text-sm font-bold flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <main className="flex flex-col min-h-screen" style={{ background: '#0A0A0F' }}>

            {/* Match header */}
            <div className="relative pt-14 pb-6 px-5 overflow-hidden">
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.14) 0%, transparent 70%)' }} />

                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-green-400 text-xs font-bold mb-5 relative">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                </button>

                {match && (
                    <div className="relative">
                        {/* League badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5"
                            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <span className="text-green-400 text-[9px] font-black uppercase tracking-[0.15em]">
                                {match.competition.name}
                            </span>
                        </div>

                        {/* Teams */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-2 w-[38%]">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2"
                                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {match.homeTeam.crest
                                        ? <img src={match.homeTeam.crest} className="w-full h-full object-contain" alt="" />
                                        : <span className="text-2xl">⚽</span>
                                    }
                                </div>
                                <span className="text-white text-xs font-bold text-center leading-tight">{match.homeTeam.shortName}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Home</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-slate-600 text-xl font-black">VS</span>
                                <span className="text-slate-400 text-[10px] px-2.5 py-1 rounded-lg font-bold"
                                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {new Date(match.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="flex flex-col items-center gap-2 w-[38%]">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2"
                                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {match.awayTeam.crest
                                        ? <img src={match.awayTeam.crest} className="w-full h-full object-contain" alt="" />
                                        : <span className="text-2xl">⚽</span>
                                    }
                                </div>
                                <span className="text-white text-xs font-bold text-center leading-tight">{match.awayTeam.shortName}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Away</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="mx-5 mb-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

            {/* LOCKED STATE */}
            {isLocked && (
                <div className="flex-1 flex flex-col px-5 pb-28">
                    {/* Blurred preview */}
                    <div className="space-y-3 pointer-events-none select-none mb-4" style={{ filter: 'blur(6px)', opacity: 0.3 }}>
                        {['📊 Outcome Probabilities', '🤖 AI Verdict', '⚽ Goal Markets', '📐 Expected Goals (xG)'].map(label => (
                            <div key={label} className="h-20 rounded-2xl flex items-center px-4"
                                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Lock card */}
                    <div className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
                        style={{
                            background: '#111118',
                            border: '1px solid rgba(34,197,94,0.2)',
                            boxShadow: '0 0 40px rgba(22,163,74,0.12)',
                        }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            🔒
                        </div>
                        <div>
                            <p className="text-white font-black text-lg font-display">Pro Prediction Locked</p>
                            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                                Upgrade to <span className="text-green-400 font-bold">NaijaBetAI Pro</span> to unlock full AI analysis, goal markets, xG, form & best bets.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/subscribe')}
                            className="w-full font-black text-sm py-3.5 rounded-xl text-white active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
                        >
                            Upgrade to Pro →
                        </button>
                        <button onClick={() => router.back()} className="text-slate-600 text-xs">
                            Maybe later
                        </button>
                    </div>
                </div>
            )}

            {/* PRO CONTENT */}
            {!isLocked && prediction && (
                <div className="flex-1 overflow-y-auto px-5 pb-28 space-y-3" style={{ scrollbarWidth: 'none' }}>

                    {/* Outcome Probabilities */}
                    <Card label="📊 Outcome Probabilities">
                        <div className="flex gap-2 mb-3">
                            {[
                                { label: 'Home Win', pct: prediction.homeWinPct, team: match?.homeTeam.shortName, color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
                                { label: 'Draw', pct: prediction.drawPct, team: 'Both', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
                                { label: 'Away Win', pct: prediction.awayWinPct, team: match?.awayTeam.shortName, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
                            ].map(o => {
                                const isTop = o.pct === Math.max(prediction.homeWinPct, prediction.drawPct, prediction.awayWinPct)
                                return (
                                    <div key={o.label} className="flex-1 rounded-xl p-3 flex flex-col items-center gap-1.5"
                                        style={{ background: o.bg, border: `1px solid ${o.border}` }}>
                                        <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">{o.label}</span>
                                        <span className="text-2xl font-black font-display" style={{ color: o.color }}>{o.pct}%</span>
                                        <span className="text-[8px] text-slate-500 truncate w-full text-center">{o.team}</span>
                                        {isTop && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md text-white"
                                                style={{ background: 'rgba(34,197,94,0.3)' }}>AI Pick ✓</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {/* Probability bar */}
                        <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                            <div className="rounded-full bg-green-400" style={{ flex: prediction.homeWinPct }} />
                            <div className="rounded-full bg-slate-500" style={{ flex: prediction.drawPct }} />
                            <div className="rounded-full bg-blue-400" style={{ flex: prediction.awayWinPct }} />
                        </div>
                    </Card>

                    {/* AI Verdict */}
                    <Card label="🤖 AI Verdict">
                        <div className="rounded-xl p-4"
                            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold mb-1">Best Bet</p>
                                    <p className="text-white font-black text-sm font-display">{prediction.verdict}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Confidence</span>
                                    <span className="text-green-400 text-2xl font-black font-display">{prediction.confidence}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="h-full rounded-full"
                                    style={{ width: `${prediction.confidence}%`, background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
                            </div>
                        </div>
                    </Card>

                    {/* Goal Markets */}
                    <Card label="⚽ Goal Markets">
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'BTTS', value: `${prediction.btts}%` },
                                { label: 'Over 2.5', value: `${prediction.over25}%` },
                                { label: 'Over 1.5', value: `${prediction.over15}%` },
                                { label: 'Under 2.5', value: `${prediction.under25}%` },
                                { label: 'Clean Sheet', value: `${prediction.cleanSheet}%` },
                                { label: '1st Goal', value: prediction.firstGoal },
                            ].map(m => (
                                <div key={m.label} className="rounded-xl p-2.5 flex flex-col items-center gap-1.5"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold text-center">{m.label}</span>
                                    <span className="text-white text-sm font-black font-display">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* xG */}
                    <Card label="📐 Expected Goals (xG)">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold mb-1">{match?.homeTeam.shortName}</p>
                                <span className="text-green-400 text-3xl font-black font-display">{prediction.xgHome}</span>
                            </div>
                            <div className="text-slate-700 font-black text-sm">xG</div>
                            <div className="text-right">
                                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold mb-1">{match?.awayTeam.shortName}</p>
                                <span className="text-blue-400 text-3xl font-black font-display">{prediction.xgAway}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Risk */}
                    <Card label="⚠️ Risk Rating">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-white text-sm font-bold mb-1">{prediction.riskLevel} Risk</p>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{prediction.riskReason}</p>
                            </div>
                            <span className="ml-4 text-xs font-black px-3 py-1.5 rounded-xl shrink-0"
                                style={prediction.riskLevel === 'LOW'
                                    ? { color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }
                                    : prediction.riskLevel === 'MEDIUM'
                                        ? { color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }
                                        : { color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }
                                }>
                                {prediction.riskLevel}
                            </span>
                        </div>
                    </Card>

                    {/* Key Factors */}
                    <Card label="🔍 Key Factors">
                        <div className="space-y-2">
                            {prediction.keyFactors.map((f, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span className="text-sm mt-0.5">{f.icon}</span>
                                    <span className="text-slate-300 text-xs flex-1 leading-relaxed">{f.text}</span>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                                        style={f.type === 'positive'
                                            ? { color: '#4ade80', background: 'rgba(34,197,94,0.1)' }
                                            : f.type === 'negative'
                                                ? { color: '#f87171', background: 'rgba(239,68,68,0.1)' }
                                                : { color: '#94a3b8', background: 'rgba(148,163,184,0.1)' }}>
                                        {f.type === 'positive' ? '+' : f.type === 'negative' ? '–' : '~'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Best Bet */}
                    <Card label="💡 AI Best Bet">
                        <div className="rounded-xl p-4"
                            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-amber-400/70 text-[9px] font-black uppercase tracking-wider">⭐ Recommended</span>
                                <span className="text-amber-400 text-2xl font-black font-display">{prediction.bestBetOdds}</span>
                            </div>
                            <p className="text-white font-bold text-sm mb-2">{prediction.bestBet}</p>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{prediction.bestBetReason}</p>
                        </div>
                    </Card>

                    {/* Recent Form */}
                    <Card label="📈 Recent Form">
                        <div className="space-y-3">
                            {[
                                { name: match?.homeTeam.shortName, form: prediction.homeForm },
                                { name: match?.awayTeam.shortName, form: prediction.awayForm },
                            ].map(({ name, form }) => (
                                <div key={name} className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[10px] w-16 truncate font-medium">{name}</span>
                                    <div className="flex gap-1.5">
                                        {form.map((r, i) => (
                                            <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                                                style={{
                                                    background: r === 'W' ? '#16a34a' : r === 'D' ? '#374151' : '#dc2626',
                                                    border: `1px solid ${r === 'W' ? 'rgba(34,197,94,0.3)' : r === 'D' ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.3)'}`,
                                                }}>
                                                {r}
                                            </div>
                                        ))}
                                        {form.length === 0 && <span className="text-slate-600 text-[10px]">No data</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* H2H */}
                    <Card label="⚔️ Head to Head">
                        {prediction.h2h.length === 0 ? (
                            <p className="text-slate-600 text-xs">No H2H data available</p>
                        ) : (
                            <div className="space-y-0">
                                {prediction.h2h.map((g, i) => (
                                    <div key={i} className={`flex items-center justify-between py-2.5 ${i < prediction.h2h.length - 1 ? 'border-b' : ''
                                        }`} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <span className="text-slate-600 text-[9px] w-10">{g.date}</span>
                                        <span className="text-white text-xs font-bold flex-1 text-center">
                                            {g.homeTeam} {g.homeScore}–{g.awayScore} {g.awayTeam}
                                        </span>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg"
                                            style={g.result === 'W'
                                                ? { color: '#4ade80', background: 'rgba(34,197,94,0.1)' }
                                                : g.result === 'D'
                                                    ? { color: '#94a3b8', background: 'rgba(148,163,184,0.1)' }
                                                    : { color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                                            {g.result}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            <BottomNav active="home" />
        </main>
    )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl p-4" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold mb-3">{label}</p>
            {children}
        </div>
    )
}