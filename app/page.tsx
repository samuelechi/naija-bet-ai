'use client'

import { useState, useEffect } from 'react'
import { Match } from '@/types'
import MatchCard from '@/components/match/MatchCard'
import BottomNav from '@/components/layout/BottomNav'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const FILTERS = [
  'All', 'EPL', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'UCL', 'UEL', 'UECL', 'AFCON', 'CAF', 'NPFL',
  'Saudi', 'MLS', 'WSL', 'Nations League'
]

const LEAGUE_MAP: Record<string, string[]> = {
  'EPL': ['Premier League'],
  'La Liga': ['Primera Division', 'La Liga'],
  'Serie A': ['Serie A'],
  'Bundesliga': ['Bundesliga'],
  'Ligue 1': ['Ligue 1'],
  'UCL': ['UEFA Champions League'],
  'UEL': ['UEFA Europa League'],
  'UECL': ['UEFA Europa Conference League', 'Conference League'],
  'AFCON': ['Africa Cup of Nations', 'AFCON'],
  'CAF': ['CAF Champions League'],
  'NPFL': ['NPFL', 'Nigerian Professional Football League'],
  'Saudi': ['Saudi Professional League', 'Saudi Pro League'],
  'MLS': ['MLS', 'Major League Soccer'],
  'WSL': ["Women's Super League", 'WSL'],
  'Nations League': ['UEFA Nations League', 'Nations League'],
}

export default function Home() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
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

  const filtered = activeFilter === 'All'
    ? matches
    : matches.filter(m =>
      LEAGUE_MAP[activeFilter]?.some(l =>
        m.competition.name.toLowerCase().includes(l.toLowerCase())
      )
    )

  return (
    <main className="flex flex-col min-h-screen" style={{ background: '#0A0A0F' }}>

      {/* Header */}
      <div className="relative pt-14 pb-5 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.18) 0%, transparent 70%)' }} />
        </div>

        {/* Top row */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #166534, #15803d)', border: '1px solid rgba(74,222,128,0.2)' }}>
              ⚽
            </div>
            <div>
              <span className="text-white font-black text-base tracking-tight font-display">NaijaBetAI</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] text-green-400/70 uppercase tracking-wider font-bold">Live Predictions</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #1f2937, #111827)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            😎
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2.5 relative">
          {[
            { label: 'Win Rate', value: `${winRate}%` },
            { label: "Today's Matches", value: `${matches.length}` },
            { label: 'Your Plan', value: userPlan === 'pro' ? 'PRO' : 'FREE' },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-2xl px-3 py-3"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{s.label}</p>
              <p className="font-black text-lg text-white leading-none font-display">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 shrink-0"
              style={activeFilter === f ? {
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: '#fff',
                boxShadow: '0 0 16px rgba(34,197,94,0.3)',
              } : {
                background: '#111118',
                color: '#4b5563',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

      {/* Match list */}
      <div className="flex-1 px-5 pb-28 space-y-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse"
                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
              ⚽
            </div>
            <div className="text-center">
              <p className="text-white font-bold mb-1">
                {activeFilter === 'All' ? 'No matches today' : `No ${activeFilter} matches today`}
              </p>
              <p className="text-slate-500 text-xs">
                {activeFilter === 'All'
                  ? "Check back later for today's predictions"
                  : 'Try a different league or check back later'}
              </p>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">
                Today's Predictions
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <span className="text-[10px] text-green-500 font-bold">{filtered.length} matches</span>
            </div>
            {filtered.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </>
        )}
      </div>

      <BottomNav active="home" />
    </main>
  )
}