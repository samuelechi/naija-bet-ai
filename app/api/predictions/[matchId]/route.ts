import { NextRequest, NextResponse } from 'next/server'
import { generatePrediction } from '@/lib/ai'
import { getTeamForm, getH2H } from '@/lib/football'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    const { matchId: matchIdStr } = await params
    const matchId = parseInt(matchIdStr)
    const { match } = await request.json()

    if (!match) {
        return NextResponse.json({ error: 'Match data required' }, { status: 400 })
    }

    // ── Auth check ───────────────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
        return NextResponse.json({ error: 'Invalid session', code: 'UNAUTHENTICATED' }, { status: 401 })
    }
    // ────────────────────────────────────────────────────────────────────────

    // ── Plan check ───────────────────────────────────────────────────────────
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

    const plan = profile?.plan ?? 'free'

    if (plan !== 'pro') {
        return NextResponse.json(
            { error: 'Pro plan required to view predictions', code: 'UPGRADE_REQUIRED' },
            { status: 403 }
        )
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
        const [homeForm, awayForm, h2h] = await Promise.all([
            getTeamForm(match.homeTeam.id),
            getTeamForm(match.awayTeam.id),
            getH2H(match.homeTeam.id, match.awayTeam.id),
        ])

        const prediction = await generatePrediction({ match, homeForm, awayForm, h2h })

        // ── Auto-save to history ─────────────────────────────────────────────
        await supabase.from('predictions').upsert({
            match_id: matchId,
            user_id: user.id,
            match_date: match.utcDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
            home_team: match.homeTeam.shortName,
            away_team: match.awayTeam.shortName,
            competition: match.competition.name,
            verdict: prediction.verdict,
            prediction_data: prediction,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        }, {
            onConflict: 'match_id,user_id',
            ignoreDuplicates: true,
        })
        // ────────────────────────────────────────────────────────────────────

        return NextResponse.json({ prediction, cached: false })
    } catch (error) {
        console.error('Prediction error:', error)
        return NextResponse.json({ error: 'Failed to generate prediction' }, { status: 500 })
    }
}