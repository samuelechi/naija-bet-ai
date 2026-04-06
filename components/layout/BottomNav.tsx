'use client'

import Link from 'next/link'

type NavPage = 'home' | 'history' | 'profile'

export default function BottomNav({ active }: { active: NavPage }) {
    const items = [
        { page: 'home' as NavPage, label: 'Home', href: '/home', icon: HomeIcon },
        { page: 'history' as NavPage, label: 'History', href: '/history', icon: HistoryIcon },
        { page: 'profile' as NavPage, label: 'Profile', href: '/profile', icon: ProfileIcon },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
            <div className="w-full max-w-md mx-auto">
                <div className="relative bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/6 flex justify-around items-center h-17 px-2">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-linear-to-r from-transparent via-green-500/40 to-transparent" />
                    {items.map((item) => {
                        const isActive = item.page === active
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.page}
                                href={item.href}
                                className="flex flex-col items-center gap-1 py-2 px-5 relative group"
                            >
                                {isActive && (
                                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-400 rounded-full" />
                                )}
                                <div className={`transition-all duration-200 ${isActive ? 'text-green-400 scale-110' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                    <Icon />
                                </div>
                                <span className={`text-[9px] uppercase tracking-[0.12em] font-bold transition-colors ${isActive ? 'text-green-400' : 'text-slate-600'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
                <div className="h-safe-bottom bg-[#0A0A0F]" />
            </div>
        </nav>
    )
}

function HomeIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )
}

function HistoryIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    )
}

function ProfileIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}