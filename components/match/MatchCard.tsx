'use client'

import { useRouter } from 'next/navigation'
import { Match } from '@/types'

const LEAGUE_FLAGS: Record<string, string> = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Championship': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
    'Champions League': '🏆',
    'Europa League': '🏅',
    'Conference League': '🥈',
    'Nigeria Premier Football League': '🇳🇬',
    'Africa Cup of Nations 2025': '🌍',
    'CAF Champions League': '🌍',
    'Saudi Pro League': '🇸🇦',
    'MLS': '🇺🇸',
    'Scottish Premiership': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Eredivisie': '🇳🇱',
    'Liga Portugal Betclic': '🇵🇹',
    'Pro League': '🇧🇪',
    'Trendyol Super Lig': '🇹🇷',
    'Super League': '🇨🇭',
    'Superliga': '🇷🇴',
    'Ekstraklasa': '🇵🇱',
    'Stoiximan Super League': '🇬🇷',
    'Parva Liga': '🇧🇬',
    'Allsvenskan': '🇸🇪',
    'Brasileirão Serie A': '🇧🇷',
    'Brasileirão Serie B': '🇧🇷',
    'Copa do Brasil': '🇧🇷',
    'Liga MX Apertura': '🇲🇽',
    'Liga MX Clausura': '🇲🇽',
    'Copa Libertadores': '🏆',
    'Copa Sudamericana': '🥈',
    'World Cup 2026': '🌍',
    'International Friendly Games': '🤝',
    'Liga F': '👩',
}

const ACCENT_COLORS: Record<string, { from: string; to: string; glow: string }> = {
    'Premier League': { from: '#10B981', to: '#34D399', glow: 'rgba(16,185,129,0.15)' },
    'Championship': { from: '#10B981', to: '#34D399', glow: 'rgba(16,185,129,0.15)' },
    'La Liga': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'Serie A': { from: '#3B82F6', to: '#60A5FA', glow: 'rgba(59,130,246,0.15)' },
    'Bundesliga': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'Ligue 1': { from: '#FFFFFF', to: '#CBD5E1', glow: 'rgba(255,255,255,0.10)' },
    'Champions League': { from: '#8B5CF6', to: '#A78BFA', glow: 'rgba(139,92,246,0.15)' },
    'Europa League': { from: '#F97316', to: '#FB923C', glow: 'rgba(249,115,22,0.15)' },
    'Conference League': { from: '#06B6D4', to: '#22D3EE', glow: 'rgba(6,182,212,0.15)' },
    'Nigeria Premier Football League': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Africa Cup of Nations 2025': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'CAF Champions League': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Saudi Pro League': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'MLS': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'Scottish Premiership': { from: '#3B82F6', to: '#60A5FA', glow: 'rgba(59,130,246,0.15)' },
    'Eredivisie': { from: '#F97316', to: '#FB923C', glow: 'rgba(249,115,22,0.15)' },
    'Liga Portugal Betclic': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'Pro League': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'Trendyol Super Lig': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'Super League': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'Superliga': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'Ekstraklasa': { from: '#EF4444', to: '#F87171', glow: 'rgba(239,68,68,0.15)' },
    'Stoiximan Super League': { from: '#3B82F6', to: '#60A5FA', glow: 'rgba(59,130,246,0.15)' },
    'Parva Liga': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Allsvenskan': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'Brasileirão Serie A': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Brasileirão Serie B': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Copa do Brasil': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Liga MX Apertura': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Liga MX Clausura': { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.15)' },
    'Copa Libertadores': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'Copa Sudamericana': { from: '#3B82F6', to: '#60A5FA', glow: 'rgba(59,130,246,0.15)' },
    'World Cup 2026': { from: '#F59E0B', to: '#FBBF24', glow: 'rgba(245,158,11,0.15)' },
    'International Friendly Games': { from: '#6366F1', to: '#818CF8', glow: 'rgba(99,102,241,0.15)' },
    'Liga F': { from: '#EC4899', to: '#F472B6', glow: 'rgba(236,72,153,0.15)' },
}

const DEFAULT_ACCENT = { from: '#6366F1', to: '#818CF8', glow: 'rgba(99,102,241,0.15)' }

export default function MatchCard({ match }: { match: Match }) {
    const router = useRouter()

    const now = new Date()
    const kickoffTime = new Date(match.utcDate)
    const matchEndTime = new Date(kickoffTime.getTime() + 105 * 60 * 1000)

    const isLive = now >= kickoffTime && now <= matchEndTime
    const isFinished = now > matchEndTime

    const kickoff = kickoffTime.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
    })

    const statusLabel = isLive ? '● LIVE' : isFinished ? 'FT' : kickoff

    const flag = LEAGUE_FLAGS[match.competition.name] || '⚽'
    const accent = ACCENT_COLORS[match.competition.name] || DEFAULT_ACCENT

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
                        : isFinished
                            ? 'text-green-500 border border-green-500/30 bg-green-500/10'
                            : 'text-slate-500 border border-slate-700/50 bg-slate-800/40'
                        }`}>
                        {statusLabel}
                    </div>
                </div>

                {/* Teams row */}
                <div className="flex items-center justify-between mb-4">
                    {/* Home */}
                    <div className="flex items-center gap-2.5 flex-1">
                        {match.homeTeam.crest ? (
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center p-1.5 shrink-0">
                                <img
                                    src={match.homeTeam.crest}
                                    className="w-full h-full object-contain"
                                    alt=""
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.parentElement!.innerHTML = '<span style="font-size:18px">⚽</span>'
                                    }}
                                />
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
                                <img
                                    src={match.awayTeam.crest}
                                    className="w-full h-full object-contain"
                                    alt=""
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.parentElement!.innerHTML = '<span style="font-size:18px">⚽</span>'
                                    }}
                                />
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