'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

const ALL_LEAGUES = [
    'EPL', 'La Liga', 'Serie A', 'UCL', 'UEL', 'NPFL',
    'Bundesliga', 'Ligue 1', 'AFCON', 'CAF', 'Saudi', 'MLS', 'WSL'
]

interface Stats {
    winRate: number
    tipsUsed: number
    streak: number
    plan: string
}

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const [stats, setStats] = useState<Stats>({ winRate: 0, tipsUsed: 0, streak: 0, plan: 'free' })
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState(true)
    const [showLeagues, setShowLeagues] = useState(false)
    const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['EPL', 'NPFL'])

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) { router.push('/login'); return }
            const u = session.user
            setUser({
                name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
                email: u.email || '',
            })
            await loadStats(u.id)
        })
    }, [])

    async function loadStats(userId: string) {
        try {
            // Get plan from profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', userId)
                .single()

            // Get all predictions for this user
            const { data: predictions } = await supabase
                .from('predictions')
                .select('result, match_date')
                .eq('user_id', userId)
                .not('result', 'is', null)
                .order('match_date', { ascending: false })

            const total = predictions?.length || 0
            const won = predictions?.filter(p => p.result === 'WON').length || 0
            const winRate = total > 0 ? Math.round((won / total) * 100) : 0

            // Calculate streak — consecutive WON from most recent
            let streak = 0
            for (const p of predictions || []) {
                if (p.result === 'WON') streak++
                else break
            }

            setStats({
                winRate,
                tipsUsed: total,
                streak,
                plan: profile?.plan || 'free',
            })
        } catch (e) {
            console.error('Failed to load stats:', e)
        } finally {
            setLoading(false)
        }
    }

    function toggleLeague(league: string) {
        setSelectedLeagues(prev =>
            prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]
        )
    }

    const initials = user?.name?.slice(0, 2).toUpperCase() || 'U'
    const isPro = stats.plan === 'pro'

    return (
        <main className="flex flex-col min-h-screen" style={{ background: '#0A0A0F' }}>

            {/* Header */}
            <div className="relative pt-14 pb-6 px-5 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)' }} />

                <div className="relative flex flex-col items-center gap-3">
                    <div className="w-18 h-18 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                        style={{
                            background: 'linear-gradient(135deg, #166534, #15803d)',
                            border: '1px solid rgba(74,222,128,0.2)',
                            boxShadow: '0 0 30px rgba(22,163,74,0.2)',
                            width: 72, height: 72,
                        }}>
                        {initials}
                    </div>

                    <div className="text-center">
                        <h2 className="text-white font-black text-lg font-display">{user?.name || '...'}</h2>
                        <p className="text-slate-500 text-xs mt-0.5">{user?.email || '...'}</p>
                    </div>

                    {/* Plan badge */}
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                        style={{
                            background: isPro ? 'rgba(22,163,74,0.1)' : 'rgba(100,100,100,0.1)',
                            border: isPro ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(150,150,150,0.2)',
                        }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPro ? 'text-green-400' : 'text-slate-400'}`}>
                            {isPro ? 'PRO · Active' : 'Free Plan'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex mx-5 mb-4 rounded-2xl overflow-hidden"
                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                    { label: 'Win Rate', value: loading ? '...' : `${stats.winRate}%` },
                    { label: 'Tips Used', value: loading ? '...' : `${stats.tipsUsed}` },
                    { label: 'Day Streak', value: loading ? '...' : `${stats.streak}` },
                ].map((s, i) => (
                    <div key={s.label}
                        className={`flex-1 flex flex-col items-center py-3.5 ${i < 2 ? 'border-r' : ''}`}
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <span className="text-white font-black text-xl font-display">{s.value}</span>
                        <span className="text-slate-500 text-[9px] uppercase tracking-wider mt-0.5">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Menu */}
            <div className="flex-1 px-5 space-y-2 pb-28">

                <SectionLabel>Account</SectionLabel>

                <MenuItem
                    icon="💳"
                    iconBg="rgba(34,197,94,0.1)"
                    title="Subscription"
                    subtitle={isPro ? 'Pro Plan · Active' : 'Free Plan · Upgrade now'}
                    onClick={() => router.push('/subscribe')}
                />
                <MenuItem
                    icon="📊"
                    iconBg="rgba(56,189,248,0.1)"
                    title="Prediction History"
                    subtitle="View all past tips"
                    onClick={() => router.push('/history')}
                />

                <SectionLabel>Preferences</SectionLabel>

                {/* Notifications toggle */}
                <div
                    onClick={() => setNotifications(!notifications)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        🔔
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold">Notifications</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">
                            {notifications ? 'Pre-match alerts on' : 'Notifications off'}
                        </p>
                    </div>
                    <div
                        className="shrink-0 w-11 h-6 rounded-full relative transition-colors duration-200"
                        style={{ background: notifications ? '#16a34a' : '#1f2937' }}
                    >
                        <div
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                            style={{ left: notifications ? 'calc(100% - 22px)' : '2px' }}
                        />
                    </div>
                </div>

                {/* Favourite leagues */}
                <div>
                    <div
                        onClick={() => setShowLeagues(!showLeagues)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)' }}>
                            ⚽
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold">Favourite Leagues</p>
                            <p className="text-slate-500 text-[10px] mt-0.5 truncate">{selectedLeagues.join(', ')}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"
                            className={`transition-transform duration-200 ${showLeagues ? 'rotate-90' : ''}`}>
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>

                    {showLeagues && (
                        <div className="mt-1 p-3 rounded-2xl flex flex-wrap gap-2"
                            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {ALL_LEAGUES.map(league => (
                                <button
                                    key={league}
                                    onClick={() => toggleLeague(league)}
                                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                    style={selectedLeagues.includes(league) ? {
                                        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                        color: '#fff',
                                    } : {
                                        background: '#1a1a24',
                                        color: '#4b5563',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    {league}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <SectionLabel>Other</SectionLabel>

                {!isPro && (
                    <MenuItem
                        icon="⭐"
                        iconBg="rgba(34,197,94,0.1)"
                        title="Upgrade to Pro"
                        subtitle="Unlock all 15 markets · ₦6,000/mo"
                        onClick={() => router.push('/subscribe')}
                    />
                )}

                <div
                    onClick={async () => {
                        await supabase.auth.signOut()
                        router.push('/login')
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ background: '#111118', border: '1px solid rgba(239,68,68,0.1)' }}
                >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        🚪
                    </div>
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-bold">Sign Out</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">Log out of account</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </div>

            <BottomNav active="profile" />
        </main>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-slate-600 text-[9px] uppercase tracking-[0.15em] font-bold px-1 pt-3 pb-1">
            {children}
        </p>
    )
}

function MenuItem({ icon, iconBg, title, subtitle, onClick }: {
    icon: string
    iconBg: string
    title: string
    subtitle: string
    onClick: () => void
}) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ background: iconBg }}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">{title}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{subtitle}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </div>
    )
}