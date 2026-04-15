import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')
    if (!url) return new NextResponse('Missing url', { status: 400 })

    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-key': process.env.API_FOOTBALL_KEY!,
            }
        })
        if (!res.ok) return new NextResponse('Not found', { status: 404 })
        const buffer = await res.arrayBuffer()
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': res.headers.get('Content-Type') || 'image/png',
                'Cache-Control': 'public, max-age=86400',
            }
        })
    } catch {
        return new NextResponse('Error', { status: 500 })
    }
}