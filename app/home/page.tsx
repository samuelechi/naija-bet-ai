'use client'

import { useState, useEffect } from 'react'
import { Match } from '@/types'
import MatchCard from '@/components/match/MatchCard'
import BottomNav from '@/components/layout/BottomNav'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ... (Keep your FILTERS, LEAGUE_MAP, and getMatchStatus exactly as they are)
const FILTERS = [
    'All', 'EPL', 'Championship', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'UCL', 'UEL', 'UECL', 'AFCON', 'CAF', 'NPFL',
    'Saudi', 'MLS', 'Scottish', 'Eredivisie', 'Portugal',
    'Belgium', 'Turkey', 'Switzerland', 'Romania', 'Poland',
    'Greece', 'Bulgaria', 'Sweden', 'Brazil', 'Mexico',
    'Copa Lib', 'Copa Sud', 'World Cup', 'Friendly', 'Women'
]

const LEAGUE_MAP: Record<string, string[]> = {
    'EPL': ['Premier League'],
    'Championship': ['Championship'],
    'La Liga': ['La Liga'],
    'Serie A': ['Serie A'],
    'Bundesliga': ['Bundesliga'],
    'Ligue 1': ['Ligue 1'],
    'UCL': ['Champions League'],
    'UEL': ['Europa League'],
    'UECL': ['Conference League'],
    'AFCON': ['Africa Cup of Nations'],
    'CAF': ['CAF Champions League'],
    'NPFL': ['Nigeria Premier Football League'],
    'Saudi': ['Saudi Pro League'],
    'MLS': ['MLS'],
    'Scottish': ['Scottish Premiership'],
    'Eredivisie': ['Eredivisie'],
    'Portugal': ['Liga Portugal'],
    'Belgium': ['Pro League'],
    'Turkey': ['Trendyol Super Lig'],
    'Switzerland': ['Super League'],
    'Romania': ['Superliga'],
    'Poland': ['Ekstraklasa'],
    'Greece': ['Stoiximan Super League'],
    'Bulgaria': ['Parva Liga'],
    'Sweden': ['Allsvenskan'],
    'Brazil': ['Brasileirão Serie A', 'Brasileirão Serie B', 'Copa do Brasil'],
    'Mexico': ['Liga MX'],
    'Copa Lib': ['Copa Libertadores'],
    'Copa Sud': ['Copa Sudamericana'],
    'World Cup': ['World Cup'],
    'Friendly': ['International Friendly'],
    'Women': ['Liga F'],
}

type StatusFilter = 'All' | 'Live' | 'Scheduled' | 'FT'

function getMatchStatus(match: Match): 'Live' | 'Scheduled' | 'FT' {
    const now = new Date()
    const kickoff = new Date(match.utcDate)
    const matchEnd = new Date(kickoff.getTime() + 105 * 60 * 1000)
    if (now >= kickoff && now <= matchEnd) return 'Live'
    if (now > matchEnd) return 'FT'
    return 'Scheduled'
}

const STATUS_FILTERS: { label: string; value: StatusFilter; color: string; activeStyle: React.CSSProperties }[] = [
    {
        label: 'All',
        value: 'All',
        color: '#4b5563',
        activeStyle: { background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)', border: '1px solid rgba(255,255,255,0.2)' }
    },
    {
        label: '● Live',
        value: 'Live',
        color: '#f87171',
        activeStyle: { background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', boxShadow: '0 4px 15px rgba(239,68,68,0.4)', border: '1px solid rgba(255,255,255,0.2)' }
    },
    {
        label: 'Scheduled',
        value: 'Scheduled',
        color: '#4b5563',
        activeStyle: { background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', boxShadow: '0 4px 15px rgba(59,130,246,0.3)', border: '1px solid rgba(255,255,255,0.2)' }
    },
    {
        label: 'FT',
        value: 'FT',
        color: '#4b5563',
        activeStyle: { background: 'linear-gradient(135deg, #374151, #4b5563)', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
    },
]

export default function Home() {
    const router = useRouter()
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
    const [winRate, setWinRate] = useState(0)
    const [userPlan, setUserPlan] = useState('free')

    useEffect(() => {
        const hash = window.location.hash
        if (hash && hash.includes('type=recovery')) {
            router.push(`/reset-password${hash}`)
            return
        }

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) {
                router.push('/login')
                return
            }
            fetchMatches()
            loadUserStats(session.user.id)
        })
    }, [])

    async function fetchMatches() {
        try {
            const res = await fetch('/api/matches')
            const data = await res.json()
            setMatches(data.matches || [])
        } catch (err) {
            console.error('Failed to fetch matches:', err)
        } finally {
            setLoading(false)
        }
    }

    async function loadUserStats(userId: string) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', userId)
                .single()

            const { data: predictions } = await supabase
                .from('predictions')
                .select('result')
                .eq('user_id', userId)
                .not('result', 'is', null)

            const total = predictions?.length || 0
            const won = predictions?.filter(p => p.result === 'WON').length || 0
            setWinRate(total > 0 ? Math.round((won / total) * 100) : 0)
            setUserPlan(profile?.plan || 'free')
        } catch (e) {
            console.error('Failed to load user stats:', e)
        }
    }

    const filtered = matches
        .filter(m => {
            if (statusFilter === 'All') return true
            return getMatchStatus(m) === statusFilter
        })
        .filter(m => {
            if (activeFilter === 'All') return true
            return LEAGUE_MAP[activeFilter]?.some(l =>
                m.competition.name.toLowerCase().includes(l.toLowerCase())
            )
        })

    const liveCounts = matches.filter(m => getMatchStatus(m) === 'Live').length
    const scheduledCount = matches.filter(m => getMatchStatus(m) === 'Scheduled').length
    const ftCount = matches.filter(m => getMatchStatus(m) === 'FT').length

    return (
        <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: '#0A0A0F' }}>
            <main className="flex flex-col min-h-screen relative overflow-hidden">

                {/* Immersive Background Glow */}
                <div className="absolute top-0 left-0 right-0 h-96 pointer-events-none opacity-40"
                    style={{ background: 'radial-gradient(100% 100% at 50% 0%, rgba(34,197,94,0.15) 0%, rgba(10,10,15,0) 100%)' }} />

                {/* Header Section */}
                <div className="relative pt-14 pb-5 px-5 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-xl shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                                style={{ background: 'linear-gradient(135deg, #166534, #15803d)', border: '1px solid rgba(74,222,128,0.3)' }}>
                                ⚽
                            </div>
                            <div>
                                <h1 className="text-white font-black text-lg tracking-tight leading-none mb-1">NaijaBetAI</h1>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                                    <span className="text-[10px] text-green-400/80 uppercase tracking-widest font-bold">System Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/profile')}
                            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-lg active:scale-95 transition-transform"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
                        >
                            😎
                        </button>
                    </div>

                    {/* Stats Row (Glassmorphism) */}
                    <div className="flex gap-3">
                        {[
                            { label: 'Win Rate', value: `${winRate}%`, highlight: true },
                            { label: "Matches", value: `${matches.length}`, highlight: false },
                            { label: 'Plan', value: userPlan === 'pro' ? 'PRO' : 'FREE', highlight: userPlan === 'pro' },
                        ].map(s => (
                            <div key={s.label} className="flex-1 relative overflow-hidden rounded-2xl px-3 py-3.5 group"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                                }}>
                                {s.highlight && (
                                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500/20 rounded-full blur-xl" />
                                )}
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1 relative z-10">{s.label}</p>
                                <p className="font-black text-xl text-white leading-none relative z-10">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Filters */}
                <div className="px-5 pb-3 z-10">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {STATUS_FILTERS.map(({ label, value, activeStyle }) => {
                            const isActive = statusFilter === value
                            const count = value === 'Live' ? liveCounts : value === 'Scheduled' ? scheduledCount : value === 'FT' ? ftCount : null
                            return (
                                <button
                                    key={value}
                                    onClick={() => setStatusFilter(value)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 shrink-0"
                                    style={isActive ? activeStyle : {
                                        background: 'rgba(255,255,255,0.03)',
                                        color: '#64748b',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    {label}
                                    {count !== null && count > 0 && (
                                        <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-md text-[8px] font-black"
                                            style={{
                                                background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                                                color: isActive ? '#fff' : '#94a3b8'
                                            }}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* League Filters */}
                <div className="px-5 pb-4 z-10">
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {FILTERS.map(f => {
                            const isActive = activeFilter === f;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 shrink-0 relative overflow-hidden"
                                    style={isActive ? {
                                        background: 'rgba(34,197,94,0.1)',
                                        color: '#4ade80',
                                        border: '1px solid rgba(34,197,94,0.3)',
                                        boxShadow: '0 0 15px rgba(34,197,94,0.1)'
                                    } : {
                                        background: 'transparent',
                                        color: '#4b5563',
                                        border: '1px solid transparent',
                                    }}
                                >
                                    {f}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Divider Line */}
                <div className="mx-5 mb-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

                {/* Match List Area */}
                <div className="flex-1 px-5 pb-28 space-y-4 overflow-y-auto z-10 no-scrollbar" style={{ scrollbarWidth: 'none' }}>

                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 rounded-3xl animate-pulse"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
                            ))}
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-5 opacity-60">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" />
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    📡
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-black tracking-wide mb-1.5 text-sm">
                                    {statusFilter !== 'All'
                                        ? `No ${statusFilter} Matches`
                                        : activeFilter === 'All' ? 'No Matches Found' : `No ${activeFilter} Matches`}
                                </p>
                                <p className="text-slate-500 text-xs font-medium max-w-[200px] mx-auto leading-relaxed">
                                    {statusFilter !== 'All' || activeFilter !== 'All'
                                        ? 'Try adjusting your filters to see more games.'
                                        : 'The AI is currently analyzing upcoming fixtures. Check back soon.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                                    {statusFilter === 'All' ? "Predictions Feed" : `${statusFilter} Feed`}
                                </span>
                                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                                <span className="text-[9px] text-green-500 font-black tracking-widest px-2 py-1 rounded-md bg-green-500/10">
                                    {filtered.length} MATCHES
                                </span>
                            </div>
                            {filtered.map(match => (
                                <MatchCard key={match.id} match={match} />
                            ))}
                        </>
                    )}
                </div>

                <BottomNav active="home" />
            </main>
        </div>
    )
}