'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// --- BACKGROUND CANVAS ---
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      // Fill the entire window
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type P = { x: number; y: number; vx: number; vy: number; r: number }
    const pts: P[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add global glow to particles
      ctx.shadowBlur = 10
      ctx.shadowColor = '#22c55e'

      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34,197,94,0.6)'
        ctx.fill()
      }

      ctx.shadowBlur = 0 // reset for lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(34,197,94,${0.15 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50 mix-blend-screen z-0" />
}

// --- TYPEWRITER ---
function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[idx]
    const speed = deleting ? 30 : 70
    const timeout = setTimeout(() => {
      if (!deleting && text === word) {
        setTimeout(() => setDeleting(true), 2000)
        return
      }
      if (deleting && text === '') {
        setDeleting(false)
        setIdx(i => (i + 1) % words.length)
        return
      }
      setText(t => deleting ? t.slice(0, -1) : word.slice(0, t.length + 1))
    }, speed)
    return () => clearTimeout(timeout)
  }, [text, deleting, idx, words])

  return (
    <span className="text-green-500 relative inline-block">
      {text}
      <span className="absolute -right-2 top-1 bottom-1 w-[3px] bg-green-500 animate-pulse" />
    </span>
  )
}

// --- FLOATING MATCH CARD ---
function FloatingCard({ delayClass, className }: { delayClass?: string; className?: string }) {
  return (
    <div className={`bg-[#111118]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_-12px_rgba(34,197,94,0.25)] animate-float ${delayClass} ${className}`}>
      <div className="text-[9px] text-slate-400 font-black tracking-widest uppercase mb-2">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-black text-white">Arsenal</span>
        <span className="text-[9px] text-slate-500 font-black px-2 py-1 bg-white/5 rounded-md">VS</span>
        <span className="text-sm font-black text-white">Man City</span>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
        <span className="text-[10px] text-green-500 font-bold">AI Confidence: 87%</span>
      </div>
    </div>
  )
}

// --- NUMBER COUNTER ---
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = to / 45 // Speed of counter
      const tick = () => {
        start += step
        if (start >= to) { setVal(to); return }
        setVal(Math.floor(start))
        requestAnimationFrame(tick)
      }
      tick()
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])

  return <span ref={ref}>{val}{suffix}</span>
}

// --- MAIN PAGE ---
export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      router.push(`/reset-password${hash}`)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/home')
      } else {
        setChecking(false)
      }
    })
  }, [])

  if (checking) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#22c55e]" />
    </div>
  )

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-white font-sans overflow-x-hidden selection:bg-green-500/30">
      {/* Custom Animations injected via standard style block so you don't have to edit tailwind.config */}
      <style>{`
                @keyframes floatUp { 0%{transform:translateY(0px)} 100%{transform:translateY(-20px)} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
                .animate-float { animation: floatUp 6s ease-in-out infinite alternate; }
                .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                .delay-400 { animation-delay: 400ms; }
                .delay-500 { animation-delay: 500ms; }
                .delay-1500 { animation-delay: 1.5s !important; }
            `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between bg-[#0A0A0F]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-800 border border-green-400/20 flex items-center justify-center text-sm md:text-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]">⚽</div>
          <span className="font-black text-lg md:text-xl tracking-tight">NaijaBet<span className="text-green-500">AI</span></span>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={() => router.push('/login')} className="px-4 md:px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs md:text-sm font-bold transition-all">Login</button>
          <button onClick={() => router.push('/signup')} className="px-4 md:px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-xs md:text-sm font-bold shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 transition-all">Get Free Tips</button>
        </div>
      </nav>

      {/* HERO (Responsive Grid) */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden">
        <ParticleCanvas />

        {/* Background Glowing Orbs */}
        <div className="absolute top-1/4 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-green-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-500/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0" />

        {/* Grid Setup: 1 col on mobile, 2 cols on desktop */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

          {/* Left Copy Container */}
          <div>
            <div className="animate-fade-up delay-100 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6 md:mb-8 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span className="text-[9px] md:text-[10px] font-black text-green-400 uppercase tracking-widest">AI-Powered • Live Now</span>
            </div>

            <h1 className="animate-fade-up delay-200 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Stop Guessing.<br />
              <Typewriter words={['Start Winning.', 'Bet Smarter.', 'Trust the AI.']} />
            </h1>

            <p className="animate-fade-up delay-300 text-base md:text-lg text-slate-400 leading-relaxed mb-8 md:mb-10 max-w-md">
              Nigeria's first AI-powered football analysis app. Get data-driven predictions across <strong className="text-white">15 betting markets</strong> for EPL, UCL, La Liga & more.
            </p>

            <div className="animate-fade-up delay-400 flex flex-col sm:flex-row gap-4 mb-10 md:mb-12">
              <button onClick={() => router.push('/signup')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-base font-black shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all text-center">
                🚀 Sign Up Free
              </button>
              <a href="/NaijaBetAI.apk" download className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-base font-black flex items-center justify-center gap-2 hover:-translate-y-1 transition-all backdrop-blur-md">
                📲 Download APK
              </a>
            </div>

            <div className="animate-fade-up delay-500 flex justify-between sm:justify-start sm:gap-12 border-t border-white/10 pt-8">
              {[
                { val: 76, suffix: '+', label: 'Matches Today' },
                { val: 15, suffix: '', label: 'AI Markets' },
                { val: 30, suffix: '+', label: 'Leagues' }
              ].map(s => (
                <div key={s.label}>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1"><Counter to={s.val} suffix={s.suffix} /></div>
                  <div className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visuals Container (Hidden or scaled down on very small screens) */}
          <div className="relative flex justify-center items-end min-h-[400px] md:min-h-[500px] lg:min-h-[600px] animate-fade-up delay-400">
            {/* Core glow behind image */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[250px] md:w-[350px] h-[250px] md:h-[350px] bg-green-500/20 rounded-full blur-[60px] md:blur-[80px] pointer-events-none" />

            {/* Main Image */}
            <img src="/footballer.png" alt="NaijaBetAI Prediction" className="relative z-10 h-[350px] md:h-[450px] lg:h-[550px] object-contain drop-shadow-[0_0_30px_rgba(34,197,94,0.15)]" />

            {/* Floating UI Elements */}
            <FloatingCard className="absolute top-4 -right-2 md:top-10 md:-right-8 lg:-right-12 z-20 scale-75 md:scale-100 origin-right" />
            <FloatingCard delayClass="delay-1500" className="absolute top-1/2 -left-2 md:-left-8 lg:-left-12 z-20 border-indigo-500/20 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.2)] scale-75 md:scale-100 origin-left" />

            <div className="absolute bottom-10 -right-2 md:bottom-16 md:-right-8 z-20 bg-[#111118]/90 backdrop-blur-xl border border-green-500/30 rounded-2xl p-3 md:p-4 animate-float shadow-[0_10px_40px_rgba(34,197,94,0.2)] scale-85 md:scale-100 origin-bottom-right">
              <div className="text-[8px] md:text-[9px] text-slate-400 font-black tracking-widest uppercase mb-1">AI Confidence</div>
              <div className="text-3xl md:text-4xl font-black text-green-500 leading-none mb-1">87%</div>
              <div className="text-[10px] md:text-xs font-bold text-white">Home Win</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">Why NaijaBetAI</div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Built for Nigerian Bettors</h2>
        </div>
        {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: '🤖', title: 'Claude AI Engine', desc: "Powered by Anthropic's Claude — the most advanced AI available. Real reasoning, not just stats." },
            { icon: '⚡', title: 'Real-Time Updates', desc: 'Live match data refreshed automatically. Updates and Morning Alerts running on autopilot.' },
            { icon: '🌍', title: '30+ Leagues', desc: 'EPL, UCL, La Liga, NPFL, CAF, AFCON and more. Every league you care about, fully covered.' },
            { icon: '📊', title: '15 AI Markets', desc: '1X2, BTTS, Over/Under, Correct Score, HT/FT, Asian Handicap, Double Chance and more.' },
            { icon: '🔔', title: 'Push Notifications', desc: 'Morning tip alerts, live match updates, and expiry reminders delivered straight to your device.' },
            { icon: '📱', title: 'Android + iPhone', desc: 'Download the APK for Android. Full PWA support for iPhone — use it exactly like a native app.' },
          ].map((f, i) => (
            <div key={f.title} className="group bg-[#111118]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:-translate-y-2 hover:border-green-500/30 hover:bg-[#111118] hover:shadow-[0_10px_40px_-10px_rgba(34,197,94,0.15)] transition-all duration-300">
              <div className="text-4xl mb-4 md:mb-5 group-hover:scale-110 transition-transform origin-left">{f.icon}</div>
              <h3 className="text-base md:text-lg font-black text-white mb-2 md:mb-3">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETS */}
      <section className="py-20 md:py-24 px-6 bg-gradient-to-b from-[#0A0A0F] via-green-950/10 to-[#0A0A0F] border-y border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">AI Engine</div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8 md:mb-12">15 Markets Per Match</h2>
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            {['1X2 Result', 'Both Teams Score', 'Over/Under 2.5', 'Correct Score', 'HT/FT', 'Asian Handicap', 'Double Chance', 'Draw No Bet', 'First Goalscorer', 'Anytime Goalscorer', 'Clean Sheet', 'Over/Under 1.5', 'Over/Under 3.5', 'Match Result + BTTS', 'Cards & Corners'].map(m => (
              <div key={m} className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm font-bold text-slate-300 hover:text-green-400 hover:border-green-500/40 hover:bg-green-500/10 hover:-translate-y-1 transition-all cursor-default shadow-sm">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 md:py-28 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">Pricing</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Choose Your Plan</h2>
          </div>
          {/* Responsive Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">

            {/* Free Tier */}
            <div className="bg-[#111118]/80 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 md:p-10 hover:border-white/20 transition-colors">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Free</div>
              <div className="text-4xl md:text-5xl font-black text-white leading-none mb-2">₦0</div>
              <div className="text-sm text-slate-400 mb-8">Forever free</div>
              <div className="space-y-4 mb-8">
                {['3 AI predictions/day', '5 basic markets per match', 'EPL & UCL only', 'Standard support'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-xs font-bold">✓</div>
                    <span className="text-sm text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/signup')} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition-all">
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative bg-gradient-to-br from-[#0c1f12] to-[#111118] border border-green-500/40 rounded-[2rem] p-8 md:p-10 shadow-[0_0_40px_rgba(34,197,94,0.1)] hover:shadow-[0_0_60px_rgba(34,197,94,0.2)] transition-shadow md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-400 rounded-full px-4 py-1.5 text-[10px] font-black text-white uppercase tracking-widest shadow-lg whitespace-nowrap">
                ⭐ Most Popular
              </div>
              <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">Premium Pro</div>
              <div className="text-4xl md:text-5xl font-black text-white leading-none mb-2">₦6,000</div>
              <div className="text-sm text-slate-400 mb-8">per month</div>
              <div className="space-y-4 mb-8">
                {['Unlimited AI predictions', 'All 15 advanced markets', '30+ leagues covered globally', 'Instant Push notifications', 'Priority support', 'History & win rate stats'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.5)]">✓</div>
                    <span className="text-sm font-medium text-white">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/signup')} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-sm font-black text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all">
                Start Pro Plan
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Ready to Bet <span className="text-green-500">Smarter?</span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed">
            Join thousands of Nigerian bettors already using the NaijaBetAI Oracle to make data-driven decisions every matchday.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/signup')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-base font-black shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all">
              🚀 Create Free Account
            </button>
            <a href="/NaijaBetAI.apk" download className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-base font-black flex items-center justify-center gap-2 hover:-translate-y-1 transition-all backdrop-blur-md">
              📲 Download Android APK
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 px-6 relative z-10 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-xs">⚽</div>
            <span className="font-black text-base">NaijaBet<span className="text-green-500">AI</span></span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {[['Privacy Policy', '/privacy-policy'], ['Terms of Service', '#'], ['Login', '/login'], ['Sign Up', '/signup']].map(([label, href]) => (
              <button key={label} onClick={() => router.push(href)} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-600 font-medium">
            © {new Date().getFullYear()} NaijaBetAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}