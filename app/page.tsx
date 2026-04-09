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
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type P = { x: number; y: number; vx: number; vy: number; r: number }
    const pts: P[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
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

      ctx.shadowBlur = 0
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(34,197,94,${0.15 * (1 - dist / 130)})`
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen z-0" />
}

// --- TYPEWRITER ---
function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[idx]
    const speed = deleting ? 30 : 60
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
      <span className="absolute -right-2 top-1 bottom-1 w-0.75 bg-green-500 animate-pulse" />
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
      const step = to / 45
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

// --- PWA INSTALL BUTTON ---
function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(ios)

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsInstalled(true)
      setDeferredPrompt(null)
    }
  }

  if (isInstalled) return null

  return (
    <>
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-fade-up delay-500 opacity-0">
        <button
          onClick={handleClick}
          className="group flex items-center gap-3 bg-[#111118]/80 backdrop-blur-xl border border-green-500/30 p-2 pr-5 rounded-full shadow-[0_4px_20px_rgba(34,197,94,0.15)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.3)] hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-linear-to-r from-green-600 to-green-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="ml-0.5">
              <path d="M8 5V19L19 12L8 5Z" fill="white" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest leading-none mb-1">Install App</span>
            <span className="text-xs font-bold text-white leading-none">iOS & Android PWA</span>
          </div>
        </button>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm pb-8 px-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#111118] border border-green-500/20 rounded-3xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">📲</div>
              <div>
                <p className="text-white font-black text-sm">Add to Home Screen</p>
                <p className="text-slate-400 text-[11px]">Install NaijaBetAI on your iPhone</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { text: 'Tap the Share button', icon: '⬆️', sub: 'at the bottom of Safari' },
                { text: 'Scroll and tap', icon: '➕', sub: '"Add to Home Screen"' },
                { text: 'Tap "Add"', icon: '✅', sub: "and you're done!" },
              ].map(({ text, icon, sub }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-white text-xs font-bold">{text}</p>
                    <p className="text-slate-400 text-[10px]">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-black"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// --- FAQ ITEM ---
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${open ? 'border-green-500/30 bg-[#0c1f12]/60' : 'border-white/5 bg-[#111118]/50 hover:border-white/10'}`}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between gap-4 p-5 md:p-6">
        <span className="text-sm md:text-base font-black text-white leading-snug">{question}</span>
        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${open ? 'bg-green-500/20 border-green-500/40 rotate-45' : 'bg-white/5 border-white/10'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>
      {open && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
          <div className="h-px w-full bg-white/5 mb-4" />
          <p className="text-sm text-slate-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

// --- MAIN PAGE ---
export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)

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

  useEffect(() => {
    if (checking) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev === 0 ? 1 : 0))
    }, 20000)
    return () => clearInterval(interval)
  }, [checking])

  if (checking) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#22c55e]" />
    </div>
  )

  const faqs = [
    {
      question: 'How accurate are the AI predictions?',
      answer: 'NaijaBetAI uses Claude AI — one of the most advanced AI models in the world — to analyze team form, head-to-head records, league stats, and more. No prediction service is ever 100% accurate, but our AI gives you a serious data-driven edge over guessing. Use it as a tool to inform your decisions, and always bet responsibly.',
    },
    {
      question: 'Is NaijaBetAI free to use?',
      answer: 'Yes — you can sign up for free and get 3 AI predictions per day with access to 5 markets. If you want unlimited predictions across all 15 markets and 30+ leagues, upgrade to Pro for ₦6,000/month. Cancel anytime.',
    },
    {
      question: 'Why is the app not on the Play Store or App Store?',
      answer: "Honest answer: Apple and Google take a 30% cut of every payment made through their stores. That's not a small fee — it's a tax that hurts independent developers and gets passed on to users through higher prices. We chose to stay independent so we can keep our Pro plan affordable. You can install NaijaBetAI directly as a PWA on iPhone or download the APK on Android — no store needed. We do plan to be on the stores eventually, but when we get there, payments will stay on our website so that 30% goes back into improving the product, not into a tech monopoly.",
    },
    {
      question: 'How do I install it on Android?',
      answer: 'Two options: download the APK directly from this page and install it like any other app, or open naijabetai.com in Chrome and tap "Install App" when the prompt appears. The APK feels more like a native app; the PWA works great too and updates automatically.',
    },
    {
      question: 'How do I install it on iPhone?',
      answer: 'Open naijabetai.com in Safari, tap the Share button at the bottom of the screen, scroll down and tap "Add to Home Screen", then tap "Add". The app will appear on your home screen just like a native app.',
    },
    {
      question: 'What leagues and markets are covered?',
      answer: 'We cover 30+ leagues including EPL, Champions League, La Liga, Serie A, Bundesliga, Ligue 1, NPFL, CAF Champions League, MLS, and more. For every match, the AI analyses 15 betting markets: 1X2, BTTS, Over/Under, Correct Score, HT/FT, Asian Handicap, Double Chance, Draw No Bet, First Goal, Clean Sheet, BTTS & Win, Odd/Even Goals, Multi-Goals, Both Halves Over 0.5, and Win to Nil.',
    },
    {
      question: 'Is my payment secure?',
      answer: "Yes. Payments are processed by Paystack, Nigeria's most trusted payment platform. We never store your card details. Your subscription can be cancelled at any time from your profile page.",
    },
    {
      question: 'Can I cancel my Pro subscription anytime?',
      answer: 'Yes, absolutely. No lock-in contracts. Cancel from your profile page and your Pro access continues until the end of your current billing period.',
    },
  ]

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-white font-sans overflow-x-hidden selection:bg-green-500/30">
      <style>{`
        @keyframes floatUp { 0%{transform:translateY(0px)} 100%{transform:translateY(-15px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .animate-float { animation: floatUp 5s ease-in-out infinite alternate; }
        .animate-fade-up { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-1500 { animation-delay: 1.5s !important; }
      `}</style>

      {/* PWA FLOATING ACTION BUTTON */}
      <PWAInstallButton />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-5 md:px-8 py-4 flex items-center justify-between bg-[#0A0A0F]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-green-600 to-green-800 border border-green-400/20 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)]">⚽</div>
          <span className="font-black text-lg tracking-tight">NaijaBet<span className="text-green-500">AI</span></span>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => router.push('/login')} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold transition-all">Login</button>
          <button onClick={() => router.push('/login')} className="px-4 py-2 rounded-xl bg-linear-to-r from-green-600 to-green-500 text-xs font-bold shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 transition-all">Get Free Tips</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-svh flex items-center pt-24 pb-12 overflow-hidden">
        <ParticleCanvas />

        <div className="absolute top-1/4 left-0 w-75 h-75 bg-green-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-100 h-100 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">

          {/* Left Copy */}
          <div className="pt-8 md:pt-0">
            <div className="animate-fade-up delay-100 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3.5 py-1.5 mb-5 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">AI-Powered • Live Now</span>
            </div>

            <h1 className="animate-fade-up delay-200 text-[clamp(2.75rem,8vw,4.5rem)] font-black leading-[1.05] tracking-tight mb-4 md:mb-6">
              Stop Guessing.<br />
              <Typewriter words={['Start Winning.', 'Bet Smarter.', 'Trust the AI.']} />
            </h1>

            <p className="animate-fade-up delay-300 text-sm md:text-lg text-slate-400 leading-relaxed mb-8 max-w-md">
              Nigeria's first AI-powered football analysis app. Get data-driven predictions across <strong className="text-white">15 betting markets</strong> for EPL, UCL, La Liga & more.
            </p>

            <div className="animate-fade-up delay-400 flex flex-col sm:flex-row gap-3 mb-8 md:mb-10">
              <button onClick={() => router.push('/login')} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-linear-to-r from-green-600 to-green-500 text-sm md:text-base font-black shadow-[0_8px_30px_rgba(34,197,94,0.25)] hover:-translate-y-1 transition-all text-center">
                🚀 Sign Up Free
              </button>
              <a href="/NaijaBetAI.apk" download className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm md:text-base font-black flex items-center justify-center gap-2 hover:-translate-y-1 transition-all backdrop-blur-md">
                📲 Download APK
              </a>
            </div>

            <div className="animate-fade-up delay-500 flex justify-between sm:justify-start sm:gap-10 border-t border-white/5 pt-6">
              {[
                { val: 76, suffix: '+', label: 'Matches Today' },
                { val: 15, suffix: '', label: 'AI Markets' },
                { val: 30, suffix: '+', label: 'Leagues' }
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl md:text-3xl font-black text-white mb-0.5"><Counter to={s.val} suffix={s.suffix} /></div>
                  <div className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visuals */}
          <div className="relative flex justify-center items-center min-h-100 md:min-h-125 animate-fade-up delay-400 overflow-visible w-full">
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30 bg-[#111118]/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <button onClick={() => setActiveSlide(0)} className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === 0 ? 'w-6 bg-green-500 shadow-[0_0_8px_#22c55e]' : 'w-2 bg-white/20 hover:bg-white/40'}`} aria-label="Show AI Oracle" />
              <button onClick={() => setActiveSlide(1)} className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === 1 ? 'w-6 bg-green-500 shadow-[0_0_8px_#22c55e]' : 'w-2 bg-white/20 hover:bg-white/40'}`} aria-label="Show PWA Video" />
            </div>

            <div className={`absolute inset-0 flex justify-center items-center transition-all duration-700 ease-in-out ${activeSlide === 0 ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto z-20' : 'opacity-0 translate-y-4 scale-95 pointer-events-none z-0'}`}>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-62.5 h-62.5 bg-green-500/20 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full border border-green-500/30 pointer-events-none z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] md:w-[580px] md:h-[580px] rounded-full border border-green-500/20 pointer-events-none z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] md:w-[780px] md:h-[780px] rounded-full border border-green-500/10 pointer-events-none z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] md:w-[980px] md:h-[980px] rounded-full border border-green-500/5 pointer-events-none z-0 hidden sm:block" />
              <img src="/footballer.png" alt="NaijaBetAI Prediction" className="relative z-10 h-87.5 md:h-112.5 lg:h-137.5 object-contain drop-shadow-[0_0_30px_rgba(34,197,94,0.15)]" />
              <FloatingCard className="absolute top-4 -right-2 md:top-10 md:-right-8 lg:-right-12 z-20 scale-[0.65] md:scale-100 origin-right" />
              <FloatingCard delayClass="[animation-delay:1s]" className="absolute -bottom-4 left-0 md:-bottom-2 md:-left-4 z-20 border-indigo-500/20 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.2)] scale-[0.60] md:scale-90 origin-left" />
              <div className="absolute bottom-2 -right-4 md:bottom-16 md:-right-12 z-20 bg-[#111118]/90 backdrop-blur-xl border border-green-500/30 rounded-2xl p-3 md:p-4 animate-float shadow-[0_10px_40px_rgba(34,197,94,0.2)] scale-[0.75] md:scale-100 origin-bottom-right">
                <div className="text-[8px] md:text-[9px] text-slate-400 font-black tracking-widest uppercase mb-1">AI Confidence</div>
                <div className="text-3xl md:text-4xl font-black text-green-500 leading-none mb-1">87%</div>
                <div className="text-[10px] md:text-xs font-bold text-white">Home Win</div>
              </div>
            </div>

            <div className={`absolute inset-0 flex justify-center items-center transition-all duration-700 ease-in-out ${activeSlide === 1 ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto z-20' : 'opacity-0 translate-y-4 scale-95 pointer-events-none z-0'}`}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[400px] bg-green-500/20 rounded-[3rem] blur-[60px] pointer-events-none z-0" />
              <div className="relative mt-12 md:mt-0 h-[380px] md:h-[480px] aspect-[9/19] bg-[#0A0A0F] border-[6px] border-slate-800 rounded-[2.5rem] overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10 flex justify-center items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <div className="w-12 h-1.5 rounded-full bg-slate-900" />
                </div>
                <video src="/pwa-video.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none mix-blend-overlay" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-24 px-5 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">Why NaijaBetAI</div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Built for Nigerian Bettors</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: '🤖', title: 'Claude AI Engine', desc: "Powered by Anthropic's Claude — the most advanced AI available. Real reasoning, not just stats." },
            { icon: '⚡', title: 'Real-Time Updates', desc: 'Live match data refreshed automatically. Updates and Morning Alerts running on autopilot.' },
            { icon: '🌍', title: '30+ Leagues', desc: 'EPL, UCL, La Liga, NPFL, CAF, AFCON and more. Every league you care about, fully covered.' },
            { icon: '📊', title: '15 AI Markets', desc: '1X2, BTTS, Over/Under, Correct Score, HT/FT, Asian Handicap, Double Chance and more.' },
            { icon: '🔔', title: 'Push Notifications', desc: 'Morning tip alerts, live match updates, and expiry reminders delivered straight to your device.' },
            { icon: '📱', title: 'Android + iPhone', desc: 'Download the APK for Android. Full PWA support for iPhone — use it exactly like a native app.' },
          ].map((f) => (
            <div key={f.title} className="group bg-[#111118]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:-translate-y-1.5 hover:border-green-500/30 hover:bg-[#111118] hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.15)] transition-all duration-300">
              <div className="text-3xl md:text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{f.icon}</div>
              <h3 className="text-base md:text-lg font-black text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETS */}
      <section className="py-16 md:py-24 px-5 bg-linear-to-b from-[#0A0A0F] via-green-950/10 to-[#0A0A0F] border-y border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">AI Engine</div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8 md:mb-12">15 Markets Per Match</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {['1X2 Result', 'Both Teams Score', 'Over/Under 2.5', 'Correct Score', 'HT/FT', 'Asian Handicap', 'Double Chance', 'Draw No Bet', 'First Goalscorer', 'Anytime Goalscorer', 'Clean Sheet', 'Over/Under 1.5', 'Over/Under 3.5', 'Match Result + BTTS', 'Cards & Corners'].map(m => (
              <div key={m} className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm font-bold text-slate-300 hover:text-green-400 hover:border-green-500/40 hover:bg-green-500/10 hover:-translate-y-1 transition-all cursor-default shadow-sm">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 md:py-28 px-5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">Pricing</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Choose Your Plan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">

            {/* Free Tier */}
            <div className="bg-[#111118]/80 backdrop-blur-md border border-white/10 rounded-4xl p-8 md:p-10 hover:border-white/20 transition-colors">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Free</div>
              <div className="text-4xl md:text-5xl font-black text-white leading-none mb-2">₦0</div>
              <div className="text-sm text-slate-400 mb-8">Forever free</div>
              <div className="space-y-4 mb-8">
                {['3 AI predictions/day', '5 basic markets per match', 'EPL & UCL only', 'Standard support'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-xs font-bold shrink-0">✓</div>
                    <span className="text-sm text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/signup')} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition-all">
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative bg-linear-to-br from-[#0c1f12] to-[#111118] border border-green-500/40 rounded-4xl p-8 md:p-10 shadow-[0_0_40px_rgba(34,197,94,0.1)] md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-green-600 to-green-400 rounded-full px-4 py-1.5 text-[10px] font-black text-white uppercase tracking-widest shadow-lg whitespace-nowrap">
                ⭐ Most Popular
              </div>
              <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">Premium Pro</div>
              <div className="text-4xl md:text-5xl font-black text-white leading-none mb-2">₦6,000</div>
              <div className="text-sm text-slate-400 mb-8">per month</div>
              <div className="space-y-4 mb-8">
                {['Unlimited AI predictions', 'All 15 advanced markets', '30+ leagues covered globally', 'Instant Push notifications', 'Priority support', 'History & win rate stats'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0">✓</div>
                    <span className="text-sm font-medium text-white">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/signup')} className="w-full py-4 rounded-xl bg-linear-to-r from-green-600 to-green-500 text-sm font-black text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all">
                Start Pro Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 px-5 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-[11px] text-green-500 font-black uppercase tracking-widest mb-3">FAQ</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Got Questions?</h2>
            <p className="text-sm text-slate-400 mt-3">Everything you need to know before you start.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-24 px-5 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 md:w-150 h-75 md:h-150 bg-green-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 md:mb-6">
            Ready to Bet <span className="text-green-500">Smarter?</span>
          </h2>
          <p className="text-sm md:text-lg text-slate-400 mb-8 md:mb-10 leading-relaxed">
            Join thousands of Nigerian bettors already using the NaijaBetAI Oracle to make data-driven decisions every matchday.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button onClick={() => router.push('/login')} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-linear-to-r from-green-600 to-green-500 text-sm md:text-base font-black shadow-[0_8px_30px_rgba(34,197,94,0.25)] hover:-translate-y-1 transition-all">
              🚀 Create Free Account
            </button>
            <a href="/NaijaBetAI.apk" download className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm md:text-base font-black flex items-center justify-center gap-2 hover:-translate-y-1 transition-all backdrop-blur-md">
              📲 Download Android APK
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 px-5 relative z-10 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-green-600 to-green-800 flex items-center justify-center text-xs">⚽</div>
            <span className="font-black text-base">NaijaBet<span className="text-green-500">AI</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 md:gap-8">
            {[['Privacy Policy', '/privacy-policy'], ['Terms of Service', '#'], ['Login', '/login'], ['Sign Up', '/login']].map(([label, href]) => (
              <button key={label} onClick={() => router.push(href)} className="text-xs md:text-sm font-bold text-slate-400 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>
          <div className="text-[10px] md:text-xs text-slate-600 font-medium">
            © {new Date().getFullYear()} NaijaBetAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}