import { NextRequest, NextResponse } from 'next/server'


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        // Fetch the image from the external API, spoofing a standard browser User-Agent
        // to bypass API-Sports hotlinking/CORS protection.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            // Prevent Next.js from aggressively caching a broken request
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Team Logo Proxy Failed: ${response.status} for URL: ${url}`);
            return new NextResponse(`Failed to fetch image`, { status: response.status });
        }

        // Convert the image data to a buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Forward the correct content type (usually image/png or image/svg+xml)
        const contentType = response.headers.get('content-type') || 'image/png';

        // Return the image buffer to the frontend, telling the browser to cache it for 24 hours
        // so we don't spam the external API on every page load.
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            },
        });

    } catch (error) {
        console.error('Error proxying team logo:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}