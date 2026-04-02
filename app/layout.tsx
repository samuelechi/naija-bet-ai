import type { Metadata } from 'next'
import './globals.css'
import OneSignalInit from '../components/OneSignalInit'

export const metadata: Metadata = {
  title: 'NaijaBetAI',
  description: 'AI-powered football predictions for Nigerian bettors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <OneSignalInit />
        <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
