import type { Metadata } from 'next'
import './globals.css'
import OneSignalInit from '../components/OneSignalInit'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'NaijaBetAI - AI Football Predictions & Insights Nigeria',
  description: 'Nigeria\'s first AI-powered football analysis app. Get data-driven insights across 9 betting markets for EPL, Champions League, La Liga & more. Free & Pro plans available.',
  keywords: 'football predictions Nigeria, AI football analysis, betting tips Nigeria, EPL predictions, sure prediction Nigeria, football insights Nigeria, NaijaBetAI, football analysis app Nigeria, sure banker today, correct score prediction Nigeria',
  authors: [{ name: 'NaijaBetAI' }],
  creator: 'NaijaBetAI',
  publisher: 'NaijaBetAI',
  applicationName: 'NaijaBetAI',
  category: 'sports',
  metadataBase: new URL('https://naijabetai.com'),
  alternates: {
    canonical: 'https://naijabetai.com',
  },
  openGraph: {
    title: 'NaijaBetAI - AI Football Predictions Nigeria',
    description: 'AI-powered football analysis for Nigerian bettors. 9 markets per match, detailed reasoning, EPL, UCL, La Liga & more. Free & Pro plans.',
    url: 'https://naijabetai.com',
    siteName: 'NaijaBetAI',
    locale: 'en_NG',
    type: 'website',
    images: [
      {
        url: 'https://naijabetai.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NaijaBetAI - AI Football Predictions Nigeria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaijaBetAI - AI Football Predictions Nigeria',
    description: 'AI-powered football analysis for Nigerian bettors. 9 markets per match, EPL, UCL & more.',
    images: ['https://naijabetai.com/og-image.png'],
    creator: '@naijabetai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: '0FxKzO0efK-U5NnKPV44Vl4nYJorIdZTv1f6DB_dYsI',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'NaijaBetAI',
  description: 'Nigeria\'s first AI-powered football analysis app. Get data-driven insights across 9 betting markets for EPL, Champions League, La Liga & more.',
  url: 'https://naijabetai.com',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Android, Web',
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NGN',
      name: 'Free Plan',
    },
    {
      '@type': 'Offer',
      price: '6000',
      priceCurrency: 'NGN',
      name: 'Pro Plan',
      billingIncrement: 'P1M',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '120',
  },
  inLanguage: 'en-NG',
  countriesSupported: 'NG',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-NG">
      <head>
        {/* Fonts */}
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

        {/* PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NaijaBetAI" />
        <meta name="theme-color" content="#0A0A0F" />
        <meta name="msapplication-TileColor" content="#0A0A0F" />

        {/* Geo targeting Nigeria */}
        <meta name="geo.region" content="NG" />
        <meta name="geo.placename" content="Nigeria" />
        <meta name="language" content="English" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        <meta name="coverage" content="Nigeria" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
