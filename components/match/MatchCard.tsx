'use client'

import { useRouter } from 'next/navigation'
import { Match } from '@/types'

const LEAGUE_FLAGS: Record<string, string> = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Primera Division': '🇪🇸',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'UEFA Champions League': '🏆',
    'NPFL': '🇳🇬',
}

const ACCENT_COLORS: Record<string, { from: string; to: string; glow: string }> = {
    'Premier League': { from: '#10B981', to: '#34D399', glow: 'rgba(16,185,129,0.15)' },
    'Primera Division': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'Serie A': { from: '#3B82F6', to: '#60A5FA', glow: 'rgba(59,130,246,0.15)' },
    'Bundesliga': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'UEFA Champions League': { from: '#8B5CF6', to: '#A78BFA', glow: 'rgba(139,92,246,0.15)' },
    'NPFL': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
}

export default function MatchCard({ match }: { match: Match }) {
    const router = useRouter()
    const flag = LEAGUE_FLAGS[match.competition.name] || '⚽'
    const accent = ACCENT_COLORS[match.competition.name] || ACCENT_COLORS['Premier League']
    const kickoff = new Date(match.utcDate).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
    })
    const isLive = match.status === 'LIVE'

    return (
        <div
            onClick={() => router.push(`/matches/${match.id}?match=${encodeURIComponent(JSON.stringify(match))}`)}
            className="relative rounded-2xl cursor-pointer overflow-hidden active:scale-[0.98] transition-transform duration-150"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            {/* Top accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${accent.from}, ${accent.to}, transparent)` }} />

            {/* Subtle glow blob */}
            <div className="absolute top-0 right-0 w-32 h-20 rounded-full blur-2xl pointer-events-none"
                style={{ background: accent.glow }} />

            <div className="p-4">
                {/* League row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">{flag}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-[0.12em] font-bold">
                            {match.competition.name}
                        </span>
                    </div>
                    <div className={`text-[9px] px-2.5 py-1 rounded-lg font-bold tracking-wider ${isLive
                        ? 'text-red-400 border border-red-500/30 bg-red-500/10'
                        : 'text-slate-500 border border-slate-700/50 bg-slate-800/40'
                        }`}>
                        {isLive ? '● LIVE' : kickoff}
                    </div>
                </div>

                {/* Teams row */}
                <div className="flex items-center justify-between mb-4">
                    {/* Home */}
                    <div className="flex items-center gap-2.5 flex-1">
                        {match.homeTeam.crest ? (
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center p-1.5 shrink-0">
                                <img src={match.homeTeam.crest} className="w-full h-full object-contain" alt="" />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">⚽</div>
                        )}
                        <span className="text-white text-sm font-bold leading-tight">{match.homeTeam.shortName}</span>
                    </div>

                    {/* VS badge */}
                    <div className="flex flex-col items-center px-3">
                        <span className="text-[10px] text-slate-600 font-black tracking-widest bg-slate-800/60 px-2.5 py-1 rounded-lg">VS</span>
                    </div>

                    {/* Away */}
                    <div className="flex items-center gap-2.5 flex-1 justify-end">
                        <span className="text-white text-sm font-bold leading-tight text-right">{match.awayTeam.shortName}</span>
                        {match.awayTeam.crest ? (
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center p-1.5 shrink-0">
                                <img src={match.awayTeam.crest} className="w-full h-full object-contain" alt="" />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">⚽</div>
                        )}
                    </div>
                </div>

                {/* AI teaser */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}33)`, border: `1px solid ${accent.from}33` }}>
                            <span className="text-[10px]">🤖</span>
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: accent.from }}>
                            View AI Prediction
                        </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent.from} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </div>
        </div>
    )
}