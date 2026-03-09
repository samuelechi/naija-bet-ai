'use client'
export const dynamic = 'force-static'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Match } from '@/types'
import BottomNav from '@/components/layout/BottomNav'
import { supabase } from '@/lib/supabase'

// ─── New prediction shape (matches PREDICTION_SYSTEM_PROMPT output) ───────────
interface FullPrediction {
    bestBet: {
        type: string
        pick: string
        confidence: number
        odds: string
        reasoning: string
    }
    predictions: {
        '1X2': { pick: string; confidence: number; odds: string; reasoning: string }
        'BTTS': { pick: string; confidence: number; odds: string; reasoning: string }
        'Over/Under': { line: string; pick: string; confidence: number; odds: string; reasoning: string }
        'Double Chance': { pick: string; confidence: number; odds: string; reasoning: string }
        'Correct Score': { pick: string; confidence: number; odds: string; reasoning: string }
        'HT/FT': { pick: string; confidence: number; odds: string; reasoning: string }
        'Asian Handicap': { pick: string; confidence: number; odds: string; reasoning: string }
        'First Goal': { pick: string; confidence: number; odds: string; reasoning: string }
        'Clean Sheet': { pick: string; confidence: number; odds: string; reasoning: string }
    }
    summary: string
    riskLevel: 'Low' | 'Medium' | 'High'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ConfidenceBar({ value, color = '#22c55e' }: { value: number; color?: string }) {
    return (
        <div className="mt-2">
            <div className="flex justify-between mb-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Confidence</span>
                <span className="text-[10px] font-black" style={{ color }}>{value}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
            </div>
        </div>
    )
}

function PredictionTile({
    emoji, label, pick, odds, confidence, reasoning, isPro, userIsPro
}: {
    emoji: string; label: string; pick: string; odds: string
    confidence: number; reasoning: string; isPro?: boolean; userIsPro: boolean
}) {
    const [expanded, setExpanded] = useState(false)
    const locked = isPro && !userIsPro
    const barColor = confidence >= 75 ? '#22c55e' : confidence >= 60 ? '#fbbf24' : '#f87171'

    return (
        <div
            onClick={() => !locked && setExpanded(e => !e)}
            className="rounded-2xl p-4 transition-all duration-200 relative overflow-hidden"
            style={{
                background: expanded ? '#13132A' : '#111118',
                border: `1px solid ${expanded ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.06)'}`,
                cursor: locked ? 'default' : 'pointer',
                opacity: locked ? 0.5 : 1,
            }}>
            {locked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10"
                    style={{ background: 'rgba(10,10,15,0.85)' }}>
                    <span className="text-slate-500 text-xs font-bold">🔒 Pro Only</span>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-lg">{emoji}</span>
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{label}</p>
                        <p className="text-white text-sm font-black mt-0.5">{pick}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Est. Odds</p>
                    <p className="text-green-400 text-lg font-black">{odds}</p>
                </div>
            </div>
            <ConfidenceBar value={confidence} color={barColor} />
            {expanded && (
                <p className="text-slate-400 text-[11px] leading-relaxed mt-3 pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {reasoning}
                </p>
            )}
        </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MatchDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const matchId = params.id as string

    const [match, setMatch] = useState<Match | null>(null)
    const [prediction, setPrediction] = useState<FullPrediction | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLocked, setIsLocked] = useState(false)
    const [userIsPro, setUserIsPro] = useState(false)
    const [activeTab, setActiveTab] = useState<'top' | 'all'>('top')

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

            // Check if user is pro
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', session?.user?.id)
                .single()
            if (profile?.plan === 'pro') setUserIsPro(true)

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

    // ── Loading ──
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

    // ── Error ──
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

            {/* ── Match Header ── */}
            <div className="relative pt-14 pb-6 px-5 overflow-hidden">
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
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5"
                            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <span className="text-green-400 text-[9px] font-black uppercase tracking-[0.15em]">
                                {match.competition.name}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-2 w-[38%]">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2"
                                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {match.homeTeam.crest
                                        ? <img src={match.homeTeam.crest} className="w-full h-full object-contain" alt="" />
                                        : <span className="text-2xl">⚽</span>}
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
                                        : <span className="text-2xl">⚽</span>}
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

            {/* ── Locked State ── */}
            {isLocked && (
                <div className="flex-1 flex flex-col px-5 pb-28">
                    <div className="space-y-3 pointer-events-none select-none mb-4" style={{ filter: 'blur(6px)', opacity: 0.3 }}>
                        {['⚡ Best Bet', '📊 Match Result (1X2)', '⚽ Goal Markets', '🎯 Correct Score'].map(label => (
                            <div key={label} className="h-20 rounded-2xl flex items-center px-4"
                                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
                        style={{ background: '#111118', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 0 40px rgba(22,163,74,0.12)' }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            🔒
                        </div>
                        <div>
                            <p className="text-white font-black text-lg">Pro Prediction Locked</p>
                            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                                Upgrade to <span className="text-green-400 font-bold">NaijaBetAI Pro</span> to unlock all 9 AI markets including Correct Score, Asian Handicap, HT/FT & more.
                            </p>
                        </div>
                        <button onClick={() => router.push('/subscribe')}
                            className="w-full font-black text-sm py-3.5 rounded-xl text-white active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}>
                            Upgrade to Pro →
                        </button>
                        <button onClick={() => router.back()} className="text-slate-600 text-xs">Maybe later</button>
                    </div>
                </div>
            )}

            {/* ── Prediction Content ── */}
            {!isLocked && prediction && (
                <div className="flex-1 overflow-y-auto px-5 pb-28 space-y-3" style={{ scrollbarWidth: 'none' }}>

                    {/* Best Bet Banner */}
                    <div className="rounded-2xl p-5 overflow-hidden relative"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 0 30px rgba(22,163,74,0.25)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl"
                            style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <p className="text-green-200/70 text-[9px] font-black uppercase tracking-[0.2em] mb-1">⚡ Best Bet</p>
                        <p className="text-white font-black text-xl mb-1">
                            {prediction.bestBet.type}: {prediction.bestBet.pick}
                        </p>
                        <p className="text-green-100/70 text-[11px] leading-relaxed mb-4">{prediction.bestBet.reasoning}</p>
                        <div className="flex gap-2 flex-wrap">
                            <span className="text-xs font-black px-3 py-1.5 rounded-xl text-white"
                                style={{ background: 'rgba(0,0,0,0.25)' }}>
                                Odds: {prediction.bestBet.odds}
                            </span>
                            <span className="text-xs font-black px-3 py-1.5 rounded-xl text-white"
                                style={{ background: 'rgba(0,0,0,0.25)' }}>
                                {prediction.bestBet.confidence}% Confidence
                            </span>
                            <span className="text-xs font-black px-3 py-1.5 rounded-xl"
                                style={{
                                    background: 'rgba(0,0,0,0.25)',
                                    color: prediction.riskLevel === 'Low' ? '#4ade80' : prediction.riskLevel === 'Medium' ? '#fbbf24' : '#f87171'
                                }}>
                                {prediction.riskLevel} Risk
                            </span>
                        </div>
                    </div>

                    {/* Match Summary */}
                    <Card label="🤖 AI Match Summary">
                        <p className="text-slate-300 text-xs leading-relaxed">{prediction.summary}</p>
                    </Card>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {(['top', 'all'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                                style={{
                                    background: activeTab === tab ? '#22c55e' : '#111118',
                                    color: activeTab === tab ? '#000' : '#64748b',
                                    border: `1px solid ${activeTab === tab ? '#22c55e' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                {tab === 'top' ? '🔥 Top Picks' : '📋 All Markets'}
                            </button>
                        ))}
                    </div>

                    {/* Top Picks Tab */}
                    {activeTab === 'top' && (
                        <>
                            <PredictionTile
                                emoji="🏆" label="Match Result (1X2)"
                                pick={prediction.predictions['1X2'].pick}
                                odds={prediction.predictions['1X2'].odds}
                                confidence={prediction.predictions['1X2'].confidence}
                                reasoning={prediction.predictions['1X2'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="⚽" label="Both Teams To Score"
                                pick={`BTTS: ${prediction.predictions['BTTS'].pick}`}
                                odds={prediction.predictions['BTTS'].odds}
                                confidence={prediction.predictions['BTTS'].confidence}
                                reasoning={prediction.predictions['BTTS'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="📊" label="Over / Under Goals"
                                pick={`${prediction.predictions['Over/Under'].pick} ${prediction.predictions['Over/Under'].line}`}
                                odds={prediction.predictions['Over/Under'].odds}
                                confidence={prediction.predictions['Over/Under'].confidence}
                                reasoning={prediction.predictions['Over/Under'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="🛡️" label="Double Chance"
                                pick={prediction.predictions['Double Chance'].pick}
                                odds={prediction.predictions['Double Chance'].odds}
                                confidence={prediction.predictions['Double Chance'].confidence}
                                reasoning={prediction.predictions['Double Chance'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="🚀" label="First Goal"
                                pick={`${prediction.predictions['First Goal'].pick} scores first`}
                                odds={prediction.predictions['First Goal'].odds}
                                confidence={prediction.predictions['First Goal'].confidence}
                                reasoning={prediction.predictions['First Goal'].reasoning}
                                userIsPro={userIsPro}
                            />
                        </>
                    )}

                    {/* All Markets Tab */}
                    {activeTab === 'all' && (
                        <>
                            <PredictionTile
                                emoji="🏆" label="Match Result (1X2)"
                                pick={prediction.predictions['1X2'].pick}
                                odds={prediction.predictions['1X2'].odds}
                                confidence={prediction.predictions['1X2'].confidence}
                                reasoning={prediction.predictions['1X2'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="⚽" label="Both Teams To Score"
                                pick={`BTTS: ${prediction.predictions['BTTS'].pick}`}
                                odds={prediction.predictions['BTTS'].odds}
                                confidence={prediction.predictions['BTTS'].confidence}
                                reasoning={prediction.predictions['BTTS'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="📊" label="Over / Under Goals"
                                pick={`${prediction.predictions['Over/Under'].pick} ${prediction.predictions['Over/Under'].line}`}
                                odds={prediction.predictions['Over/Under'].odds}
                                confidence={prediction.predictions['Over/Under'].confidence}
                                reasoning={prediction.predictions['Over/Under'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="🛡️" label="Double Chance"
                                pick={prediction.predictions['Double Chance'].pick}
                                odds={prediction.predictions['Double Chance'].odds}
                                confidence={prediction.predictions['Double Chance'].confidence}
                                reasoning={prediction.predictions['Double Chance'].reasoning}
                                userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="🚀" label="First Goal"
                                pick={`${prediction.predictions['First Goal'].pick} scores first`}
                                odds={prediction.predictions['First Goal'].odds}
                                confidence={prediction.predictions['First Goal'].confidence}
                                reasoning={prediction.predictions['First Goal'].reasoning}
                                userIsPro={userIsPro}
                            />
                            {/* PRO ONLY BELOW */}
                            <PredictionTile
                                emoji="🎯" label="Correct Score"
                                pick={prediction.predictions['Correct Score'].pick}
                                odds={prediction.predictions['Correct Score'].odds}
                                confidence={prediction.predictions['Correct Score'].confidence}
                                reasoning={prediction.predictions['Correct Score'].reasoning}
                                isPro userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="⏱️" label="Half-Time / Full-Time"
                                pick={prediction.predictions['HT/FT'].pick}
                                odds={prediction.predictions['HT/FT'].odds}
                                confidence={prediction.predictions['HT/FT'].confidence}
                                reasoning={prediction.predictions['HT/FT'].reasoning}
                                isPro userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="⚖️" label="Asian Handicap"
                                pick={prediction.predictions['Asian Handicap'].pick}
                                odds={prediction.predictions['Asian Handicap'].odds}
                                confidence={prediction.predictions['Asian Handicap'].confidence}
                                reasoning={prediction.predictions['Asian Handicap'].reasoning}
                                isPro userIsPro={userIsPro}
                            />
                            <PredictionTile
                                emoji="🧤" label="Clean Sheet"
                                pick={`${prediction.predictions['Clean Sheet'].pick} keeps clean sheet`}
                                odds={prediction.predictions['Clean Sheet'].odds}
                                confidence={prediction.predictions['Clean Sheet'].confidence}
                                reasoning={prediction.predictions['Clean Sheet'].reasoning}
                                isPro userIsPro={userIsPro}
                            />

                            {/* Pro upsell if not pro */}
                            {!userIsPro && (
                                <div className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
                                    style={{ background: '#111118', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <p className="text-white font-black text-sm">🔒 Unlock Pro Markets</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        Correct Score, HT/FT, Asian Handicap & Clean Sheet are Pro-only predictions
                                    </p>
                                    <button onClick={() => router.push('/subscribe')}
                                        className="w-full font-black text-sm py-3 rounded-xl text-white active:scale-95 transition-all"
                                        style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                                        Upgrade to Pro →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <BottomNav active="home" />
        </main>
    )
}