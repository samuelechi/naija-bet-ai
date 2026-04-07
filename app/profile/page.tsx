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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

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
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', userId)
                .single()

            const { data: predictions } = await supabase
                .from('predictions')
                .select('result, match_date')
                .eq('user_id', userId)
                .not('result', 'is', null)
                .order('match_date', { ascending: false })

            const total = predictions?.length || 0
            const won = predictions?.filter(p => p.result === 'WON').length || 0
            const winRate = total > 0 ? Math.round((won / total) * 100) : 0

            let streak = 0
            for (const p of predictions || []) {
                if (p.result === 'WON') streak++
                else break
            }

            setStats({ winRate, tipsUsed: total, streak, plan: profile?.plan || 'free' })
        } catch (e) {
            console.error('Failed to load stats:', e)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteAccount() {
        setDeleting(true)
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (!currentUser) return

            // Delete predictions
            await supabase.from('predictions').delete().eq('user_id', currentUser.id)
            // Delete profile
            await supabase.from('profiles').delete().eq('id', currentUser.id)
            // Sign out
            await supabase.auth.signOut()
            router.push('/login')
        } catch (e) {
            console.error('Failed to delete account:', e)
            setDeleting(false)
            setShowDeleteConfirm(false)
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
        <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: '#0A0A0F' }}>
            <main className="flex flex-col min-h-screen relative overflow-hidden">

                {/* Immersive Background Glow */}
                <div className="absolute top-0 left-0 right-0 h-96 pointer-events-none opacity-40"
                    style={{ background: 'radial-gradient(100% 100% at 50% 0%, rgba(34,197,94,0.15) 0%, rgba(10,10,15,0) 100%)' }} />

                {/* Header */}
                <div className="relative pt-16 pb-8 px-5 z-10">
                    <div className="relative flex flex-col items-center gap-4">

                        {/* Premium Avatar Ring */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="absolute -inset-2 rounded-full border border-green-500/10 animate-[spin_10s_linear_infinite]" />
                            <div className="absolute -inset-1 rounded-full border border-green-500/20" />

                            <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-[0_0_30px_rgba(22,163,74,0.3)] z-10"
                                style={{ background: 'linear-gradient(135deg, #166534, #15803d)', border: '2px solid rgba(74,222,128,0.4)' }}>
                                {initials}
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-white font-black text-xl font-display tracking-tight">{user?.name || 'Loading...'}</h2>
                            <p className="text-slate-400 text-xs mt-1 font-medium">{user?.email || '...'}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md"
                            style={{
                                background: isPro ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.05)',
                                border: isPro ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)'
                            }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-slate-400'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isPro ? 'text-green-400' : 'text-slate-300'}`}>
                                {isPro ? 'PRO · Active' : 'Free Plan'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Unified Glass Stats Bar */}
                <div className="mx-5 mb-6 rounded-3xl relative overflow-hidden z-10"
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px -10px rgba(0,0,0,0.5)'
                    }}>
                    <div className="flex relative z-10">
                        {[
                            { label: 'Win Rate', value: loading ? '—' : `${stats.winRate}%`, highlight: true },
                            { label: 'Tips Used', value: loading ? '—' : `${stats.tipsUsed}` },
                            { label: 'Day Streak', value: loading ? '—' : `${stats.streak}`, highlight: stats.streak >= 3 },
                        ].map((s, i) => (
                            <div key={s.label}
                                className="flex-1 flex flex-col items-center py-4 relative group">
                                {/* Dividers */}
                                {i < 2 && <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />}

                                <span className={`font-black text-2xl font-display transition-colors ${s.highlight ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'text-white'}`}>
                                    {s.value}
                                </span>
                                <span className="text-slate-500 text-[9px] uppercase tracking-widest mt-1 font-bold">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Menu Area */}
                <div className="flex-1 px-5 space-y-3 pb-28 z-10">

                    <SectionLabel>Account Management</SectionLabel>

                    <MenuItem icon="💎" iconBg="rgba(56,189,248,0.1)" iconBorder="rgba(56,189,248,0.2)" title="Subscription Details"
                        subtitle={isPro ? 'Pro Plan · Active' : 'Free Plan · Upgrade to Pro'}
                        onClick={() => router.push('/subscribe')} />

                    <MenuItem icon="📊" iconBg="rgba(167,139,250,0.1)" iconBorder="rgba(167,139,250,0.2)" title="Prediction History"
                        subtitle="View your past AI tips and results"
                        onClick={() => router.push('/history')} />

                    <SectionLabel>Preferences</SectionLabel>

                    {/* Interactive Notification Toggle */}
                    <div
                        onClick={() => setNotifications(!notifications)}
                        className="group flex items-center gap-4 px-5 py-4 rounded-3xl cursor-pointer active:scale-[0.98] transition-all duration-300 hover:bg-white/[0.04]"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}
                    >
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-all duration-300"
                            style={{
                                background: notifications ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                                border: notifications ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(251,191,36,0.2)',
                                boxShadow: notifications ? '0 0 15px rgba(34,197,94,0.2)' : 'none'
                            }}>
                            {notifications ? '🔔' : '🔕'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold">Smart Alerts</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">
                                {notifications ? 'Pre-match notifications are ON' : 'Notifications are OFF'}
                            </p>
                        </div>
                        {/* Custom iOS-style Switch */}
                        <div className="shrink-0 w-12 h-6 rounded-full relative transition-colors duration-300"
                            style={{ background: notifications ? '#16a34a' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ease-out"
                                style={{ left: notifications ? 'calc(100% - 22px)' : '2px' }} />
                        </div>
                    </div>

                    {/* League Accordion */}
                    <div className="rounded-3xl overflow-hidden transition-all duration-300"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                        <div
                            onClick={() => setShowLeagues(!showLeagues)}
                            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                                style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)' }}>⚽</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-bold">Favourite Leagues</p>
                                <p className="text-slate-400 text-[10px] mt-0.5 truncate">{selectedLeagues.join(', ')}</p>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className={`transition-transform duration-300 ${showLeagues ? 'rotate-180' : 'rotate-0'}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out ${showLeagues ? 'max-h-96 opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 flex flex-wrap gap-2.5 bg-black/20">
                                {ALL_LEAGUES.map(league => {
                                    const isSelected = selectedLeagues.includes(league);
                                    return (
                                        <button key={league} onClick={() => toggleLeague(league)}
                                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95"
                                            style={isSelected ? {
                                                background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 15px rgba(34,197,94,0.1)'
                                            } : {
                                                background: 'rgba(255,255,255,0.03)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)'
                                            }}>
                                            {league}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <SectionLabel>Danger Zone</SectionLabel>

                    {/* Cinematic Destructive Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
                            className="flex flex-col items-center justify-center gap-2 py-4 rounded-3xl active:scale-[0.98] transition-all hover:bg-white/[0.04]"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <span className="text-xl">🚪</span>
                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-wider">Sign Out</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex flex-col items-center justify-center gap-2 py-4 rounded-3xl active:scale-[0.98] transition-all relative overflow-hidden group"
                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}
                        >
                            <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                            <span className="text-xl relative z-10">💀</span>
                            <span className="text-red-400 text-[10px] font-black uppercase tracking-wider relative z-10">Delete Data</span>
                        </button>
                    </div>
                </div>

                {/* Glassmorphic Delete Confirm Modal */}
                {showDeleteConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 32px' }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !deleting && setShowDeleteConfirm(false)} />

                        <div className="relative w-full max-w-sm rounded-[32px] p-6 text-center transform transition-all animate-in slide-in-from-bottom-10"
                            style={{
                                background: 'rgba(17,17,24,0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                boxShadow: '0 20px 40px -10px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                            }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                style={{ background: 'linear-gradient(135deg, #991b1b, #dc2626)', border: '1px solid rgba(248,113,113,0.4)' }}>
                                ⚠️
                            </div>
                            <h3 className="text-white font-black text-xl mb-2 tracking-tight">Erase Everything?</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
                                This will permanently vaporize your account, all past predictions, and saved settings. This action is absolute and cannot be undone.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className="w-full py-4 rounded-2xl font-black text-sm text-white relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', opacity: deleting ? 0.7 : 1, boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
                                >
                                    {deleting ? 'Initiating wipe...' : 'Yes, Vaporize My Account'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className="w-full py-4 rounded-2xl font-bold text-sm text-slate-300 transition-colors hover:text-white"
                                    style={{ background: 'transparent' }}
                                >
                                    Abort
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <BottomNav active="profile" />
            </main>
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black px-2 pt-4 pb-2">{children}</p>
    )
}

function MenuItem({ icon, iconBg, iconBorder, title, subtitle, onClick }: {
    icon: string; iconBg: string; iconBorder: string; title: string; subtitle: string; onClick: () => void
}) {
    return (
        <div onClick={onClick}
            className="group flex items-center gap-4 px-5 py-4 rounded-3xl cursor-pointer active:scale-[0.98] transition-all duration-300 hover:bg-white/[0.04]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">{title}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{subtitle}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </div>
    )
}