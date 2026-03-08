import { NextResponse } from 'next/server'
import { getTodaysMatches } from '@/lib/football'

export const revalidate = 300

export async function GET() {
    try {
        const matches = await getTodaysMatches()
        return NextResponse.json({ matches })
    } catch (error) {
        console.error('Matches error:', error)
        return NextResponse.json({ matches: [] }, { status: 500 })
    }
}