import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'team_crests';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Migration can only be run locally' }, { status: 403 });
    }

    try {
        console.log('Fetching matches for new ID sync...');
        const { data: matches, error } = await supabase
            .from('matches')
            .select('id, home_team_id, home_team_crest, away_team_id, away_team_crest');

        if (error) throw error;

        const teams = new Map<number, string>();
        matches.forEach((match: any) => {
            // IMPORTANT: Fetch using the correct internal ID directly from Bzzoiro
            if (match.home_team_id) {
                teams.set(match.home_team_id, `https://sports.bzzoiro.com/img/team/${match.home_team_id}/`);
            }
            if (match.away_team_id) {
                teams.set(match.away_team_id, `https://sports.bzzoiro.com/img/team/${match.away_team_id}/`);
            }
        });

        console.log(`Syncing ${teams.size} logos with correct IDs...`);
        const results: string[] = [];

        for (const [teamId, targetUrl] of teams.entries()) {
            try {
                const filename = `${teamId}.png`;

                const imageRes = await fetch(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
                });

                if (!imageRes.ok) throw new Error(`Fetch failed: ${imageRes.statusText}`);

                const buffer = Buffer.from(await imageRes.arrayBuffer());

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filename, buffer, { contentType: 'image/png', upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

                await supabase.from('matches').update({ home_team_crest: publicUrl }).eq('home_team_id', teamId);
                await supabase.from('matches').update({ away_team_crest: publicUrl }).eq('away_team_id', teamId);

                results.push(`✅ Team ${teamId} synced properly`);
            } catch (err: any) {
                results.push(`❌ Team ${teamId} failed: ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, synced: results.length });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}