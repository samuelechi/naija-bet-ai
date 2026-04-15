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

const proxyUrl = (crest: string) =>
    crest ? `/api/team-logo?url=${encodeURIComponent(crest)}` : ''

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

    // Show score if live or finished, otherwise show kickoff time
    const statusLabel = isLive || isFinished
        ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
        : kickoff

    // Badge label changes based on status
    const badgeLabel = isLive ? 'LIVE' : isFinished ? 'FT' : kickoff

    const flag = LEAGUE_FLAGS[match.competition.name] || '⚽'
    const accent = ACCENT_COLORS[match.competition.name] || DEFAULT_ACCENT

    return (
        <div
            onClick={() => router.push(`/matches/${match.id}?match=${encodeURIComponent(JSON.stringify(match))}`)}
            className="group relative rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{
                background: 'linear-gradient(180deg, rgba(17,17,24,0.8) 0%, rgba(10,10,15,1) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `0 10px 30px -15px ${accent.glow}`
            }}
        >
            {/* 1. Animated Top Border Beam */}
            <div className="absolute top-0 left-0 right-0 h-[2px] w-full overflow-hidden">
                <div
                    className="h-full w-full animate-shimmer"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent.from}, ${accent.to}, transparent)` }}
                />
            </div>

            {/* 2. Interactive Hover Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[50px] pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                style={{ background: accent.from }} />

            <div className="p-5">
                {/* League header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                        <span className="text-xs">{flag}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">
                            {match.competition.name}
                        </span>
                    </div>

                    <div className={`flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full font-black tracking-tighter ${isLive ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                        isFinished ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                            'text-slate-400 bg-slate-800/40 border border-slate-700/50'
                        }`}>
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        {isLive || isFinished ? badgeLabel : statusLabel}
                    </div>
                </div>

                {/* Main Match Content */}
                <div className="grid grid-cols-3 items-center gap-2 mb-6">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group-hover:scale-110 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: accent.from }} />

                            {/* FALLBACK EMOJI IMPLEMENTATION */}
                            <div className="relative w-14 h-14 rounded-2xl bg-[#1A1A24] border border-white/5 flex items-center justify-center p-2.5 shadow-inner">
                                <span className="absolute text-2xl opacity-40 select-none">⚽</span>
                                <img
                                    src={match.homeTeam.crest ? proxyUrl(match.homeTeam.crest) : ''}
                                    className="w-full h-full object-contain relative z-10"
                                    alt=""
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                        <span className="text-white text-[11px] font-black uppercase tracking-tight text-center leading-tight h-8 flex items-center">
                            {match.homeTeam.shortName}
                        </span>
                    </div>

                    {/* VS Centerpiece */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-2" />
                        {isLive || isFinished ? (
                            <span className="text-[12px] text-white font-black tracking-widest">
                                {statusLabel}
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-500 font-black italic tracking-widest">VS</span>
                        )}
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-2" />
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group-hover:scale-110 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: accent.to }} />

                            {/* FALLBACK EMOJI IMPLEMENTATION */}
                            <div className="relative w-14 h-14 rounded-2xl bg-[#1A1A24] border border-white/5 flex items-center justify-center p-2.5 shadow-inner">
                                <span className="absolute text-2xl opacity-40 select-none">⚽</span>
                                <img src={match.awayTeam.crest ? proxyUrl(match.awayTeam.crest) : ''} className="w-full h-full object-contain relative z-10" alt="" onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.style.display = 'none';
                                }} />
                            </div>
                        </div>
                        <span className="text-white text-[11px] font-black uppercase tracking-tight text-center leading-tight h-8 flex items-center">
                            {match.awayTeam.shortName}
                        </span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="relative mt-2 p-3 rounded-2xl overflow-hidden group/btn"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/40 border border-white/10 text-xs">🤖</div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-300 group-hover/btn:text-white transition-colors">
                                AI Analysis Ready
                            </span>
                        </div>
                        <div className="flex items-center gap-1 group-hover/btn:translate-x-1 transition-transform">
                            <span className="text-[9px] font-bold" style={{ color: accent.from }}>PREDICT</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent.from} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    </div>
                    {/* Hover Button Background Liquid Effect */}
                    <div className="absolute inset-0 translate-y-10 group-hover/btn:translate-y-0 transition-transform duration-300 opacity-10"
                        style={{ background: `linear-gradient(to top, ${accent.from}, transparent)` }} />
                </div>
            </div>
        </div>
    )
}