'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type P = { x: number; y: number; vx: number; vy: number; r: number }
    const pts: P[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34,197,94,0.5)'
        ctx.fill()
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(34,197,94,${0.15 * (1 - dist / 120)})`
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

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[idx]
    const speed = deleting ? 40 : 80
    const timeout = setTimeout(() => {
      if (!deleting && text === word) {
        setTimeout(() => setDeleting(true), 1800)
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
    <span style={{ color: '#22c55e' }}>
      {text}
      <span style={{ borderRight: '3px solid #22c55e', marginLeft: 2, animation: 'blink 1s step-end infinite' }} />
    </span>
  )
}

function FloatingCard({ delay, style }: { delay: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(17,17,24,0.95)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 16,
      padding: '12px 16px',
      animation: `floatUp 6s ease-in-out ${delay}s infinite alternate`,
      backdropFilter: 'blur(12px)',
      ...style
    }}>
      <div style={{ fontSize: 9, color: '#4b5563', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Arsenal</span>
        <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 800, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>VS</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Man City</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>AI Confidence: 87%</span>
      </div>
    </div>
  )
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = to / 60
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
    <div style={{ background: '#0A0A0F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes floatUp { 0%{transform:translateY(0px)} 100%{transform:translateY(-14px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 30px rgba(34,197,94,0.2)} 50%{box-shadow:0 0 60px rgba(34,197,94,0.5)} }
        .fade-up { animation: fadeUp 0.7s ease forwards; opacity: 0; }
        .d1{animation-delay:0.1s} .d2{animation-delay:0.2s} .d3{animation-delay:0.3s} .d4{animation-delay:0.4s} .d5{animation-delay:0.5s}
        .cta-primary:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(34,197,94,0.5) !important; }
        .cta-secondary:hover { transform:translateY(-2px); border-color:rgba(34,197,94,0.5) !important; }
        .feature-card:hover { transform:translateY(-4px); border-color:rgba(34,197,94,0.3) !important; }
        .market-pill:hover { background:rgba(34,197,94,0.12) !important; border-color:rgba(34,197,94,0.4) !important; color:#22c55e !important; }
        * { box-sizing:border-box; }
        a { text-decoration:none; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#166534,#15803d)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚽</div>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px', fontFamily: "'Clash Display', sans-serif" }}>NaijaBet<span style={{ color: '#22c55e' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/login')} style={{ padding: '8px 18px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Login</button>
          <button onClick={() => router.push('/signup')} className="cta-primary" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.2s ease' }}>Get Free Tips</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80, overflow: 'hidden' }}>
        <ParticleCanvas />
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(22,163,74,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div className="fade-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '6px 14px', marginBottom: 24 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI-Powered • Live Now</span>
            </div>

            <h1 className="fade-up d2" style={{ fontSize: 'clamp(36px,5vw,58px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 20, fontFamily: "'Clash Display', sans-serif" }}>
              Stop Guessing.<br />
              <Typewriter words={['Start Winning.', 'Bet Smarter.', 'Trust the AI.']} />
            </h1>

            <p className="fade-up d3" style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Nigeria's first AI-powered football analysis app. Get data-driven predictions across <strong style={{ color: '#e2e8f0' }}>15 betting markets</strong> for EPL, UCL, La Liga & more.
            </p>

            <div className="fade-up d4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <button onClick={() => router.push('/signup')} className="cta-primary" style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.35)', transition: 'all 0.2s ease' }}>
                🚀 Sign Up Free
              </button>
              <a href="/NaijaBetAI.apk" download className="cta-secondary" style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease' }}>
                📲 Download APK
              </a>
            </div>

            <div className="fade-up d5" style={{ display: 'flex', gap: 32 }}>
              {[{ val: 76, suffix: '+', label: 'Matches Today' }, { val: 15, suffix: '', label: 'AI Markets' }, { val: 30, suffix: '+', label: 'Leagues' }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: "'Clash Display', sans-serif", lineHeight: 1 }}>
                    <Counter to={s.val} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 540 }}>
            <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(34,197,94,0.15) 0%, transparent 70%)', animation: 'glowPulse 3s ease-in-out infinite', pointerEvents: 'none' }} />
            <img src="/footballer.png" alt="NaijaBetAI" style={{ position: 'relative', zIndex: 2, height: 500, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(34,197,94,0.25))' }} />
            <div style={{ position: 'absolute', top: '5%', right: '-2%', zIndex: 3 }}>
              <FloatingCard delay={0} />
            </div>
            <div style={{ position: 'absolute', top: '38%', left: '-8%', zIndex: 3 }}>
              <FloatingCard delay={1.5} style={{ borderColor: 'rgba(99,102,241,0.25)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '16%', right: '0%', zIndex: 3, background: 'rgba(17,17,24,0.95)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: '12px 18px', animation: 'floatUp 4s ease-in-out 0.8s infinite alternate', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 9, color: '#4b5563', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>AI Confidence</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e', fontFamily: "'Clash Display', sans-serif", lineHeight: 1 }}>87%</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Home Win</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Why NaijaBetAI</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-1px', fontFamily: "'Clash Display', sans-serif", margin: 0 }}>Built for Nigerian Bettors</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { icon: '🤖', title: 'Claude AI Engine', desc: "Powered by Anthropic's Claude — the most advanced AI available. Real reasoning, not just stats, behind every prediction." },
            { icon: '⚡', title: 'Real-Time Updates', desc: 'Live match data refreshed automatically. Fetch Matches, Update Results, Morning Alerts — all running on autopilot.' },
            { icon: '🌍', title: '30+ Leagues', desc: 'EPL, UCL, La Liga, NPFL, CAF, AFCON and more. Every league Nigerian bettors care about, fully covered.' },
            { icon: '📊', title: '15 AI Markets', desc: '1X2, BTTS, Over/Under, Correct Score, HT/FT, Asian Handicap, Double Chance and more — per match.' },
            { icon: '🔔', title: 'Push Notifications', desc: 'Morning tip alerts, live match updates, and expiry reminders delivered straight to your device.' },
            { icon: '📱', title: 'Android + iPhone', desc: 'Download the APK for Android. Full PWA support for iPhone — add to home screen and use like a native app.' },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '28px 24px', cursor: 'default', transition: 'all 0.25s ease' }}>
              <div style={{ fontSize: 34, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: '#fff', margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETS */}
      <section style={{ padding: '80px 24px', background: 'rgba(34,197,94,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>AI Markets</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-1px', fontFamily: "'Clash Display', sans-serif", marginBottom: 40 }}>15 Markets Per Match</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {['1X2 Result', 'Both Teams Score', 'Over/Under 2.5', 'Correct Score', 'HT/FT', 'Asian Handicap', 'Double Chance', 'Draw No Bet', 'First Goalscorer', 'Anytime Goalscorer', 'Clean Sheet', 'Over/Under 1.5', 'Over/Under 3.5', 'Match Result + BTTS', 'Cards & Corners'].map(m => (
              <div key={m} className="market-pill" style={{ padding: '9px 18px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700, color: '#94a3b8', cursor: 'default', transition: 'all 0.2s ease' }}>{m}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-1px', fontFamily: "'Clash Display', sans-serif", margin: 0 }}>Choose Your Plan</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Free */}
            <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 28px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Free</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', fontFamily: "'Clash Display', sans-serif", lineHeight: 1, marginBottom: 6 }}>₦0</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>Forever free</div>
              {['3 AI predictions/day', '5 markets per match', 'EPL & UCL only', 'Standard support'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>{f}</span>
                </div>
              ))}
              <button onClick={() => router.push('/signup')} style={{ width: '100%', marginTop: 28, padding: '13px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease' }}>Get Started Free</button>
            </div>

            {/* Pro */}
            <div style={{ background: 'linear-gradient(145deg,#0c1f12,#111118)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 24, padding: '36px 28px', position: 'relative', animation: 'glowPulse 3s ease-in-out infinite' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius: 100, padding: '5px 18px', fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>⭐ Most Popular</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Pro</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', fontFamily: "'Clash Display', sans-serif", lineHeight: 1, marginBottom: 6 }}>₦6,000</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>per month</div>
              {['Unlimited AI predictions', 'All 15 markets', '30+ leagues covered', 'Push notifications', 'Priority support', 'History & win rate stats'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{f}</span>
                </div>
              ))}
              <button onClick={() => router.push('/signup')} className="cta-primary" style={{ width: '100%', marginTop: 28, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.2s ease' }}>Start Pro Plan</button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(22,163,74,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,54px)', fontWeight: 900, letterSpacing: '-1.5px', fontFamily: "'Clash Display', sans-serif", marginBottom: 16 }}>
            Ready to Bet <span style={{ color: '#22c55e' }}>Smarter?</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Join thousands of Nigerian bettors already using AI to make smarter decisions every matchday.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/signup')} className="cta-primary" style={{ padding: '16px 36px', borderRadius: 14, background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.4)', transition: 'all 0.2s ease' }}>
              🚀 Create Free Account
            </button>
            <a href="/NaijaBetAI.apk" download style={{ padding: '16px 36px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease' }}>
              📲 Download Android APK
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 24px', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#166534,#15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚽</div>
          <span style={{ fontWeight: 900, fontSize: 14, fontFamily: "'Clash Display', sans-serif" }}>NaijaBet<span style={{ color: '#22c55e' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Privacy', '/privacy-policy'], ['Login', '/login'], ['Sign Up', '/signup']].map(([label, href]) => (
            <button key={label} onClick={() => router.push(href)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>© 2026 NaijaBetAI. All rights reserved.</div>
      </footer>
    </div>
  )
}