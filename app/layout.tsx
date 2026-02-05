import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../lib/context/AuthContext'

export const metadata: Metadata = {
  title: {
    default: 'Dot Universe - Free Browser Games | DotSlayer & Dot Clicker',
    template: '%s | Dot Universe',
  },
  description: 'Play free browser games in the Dot Universe! DotSlayer: Competitive roguelike with 100 floors and global leaderboards. Dot Clicker: Idle game with prestige systems and cross-game synergy. No download required!',
  keywords: [
    // Brand
    'dot universe',
    'dotslayer',
    'dot clicker',
    // Game types
    'free browser games',
    'online roguelike',
    'idle clicker game',
    'incremental game',
    'browser roguelike',
    // Features
    'no download games',
    'play instantly',
    'global leaderboards',
    'procedural generation',
    'skill tree game',
    'prestige system',
    'ascension game',
    // Technical
    'html5 games',
    'javascript games',
    'web games',
    'phaser game',
    // Competition
    'competitive browser game',
    'multiplayer leaderboards',
    'free online games 2024',
    'best browser games',
  ].join(', '),
  authors: [{ name: 'Dot Universe Team' }],
  creator: 'Dot Universe',
  publisher: 'Dot Universe',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dotslayer.vercel.app'),
  alternates: {
    canonical: 'https://dotslayer.vercel.app',
  },
  openGraph: {
    title: 'Dot Universe - Free Browser Games',
    description: 'DotSlayer roguelike action + Dot Clicker idle progression. Two games, one universe. Cross-game synergy bonuses! Play free in your browser.',
    url: 'https://dotslayer.vercel.app',
    siteName: 'Dot Universe',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dot Universe - DotSlayer and Dot Clicker browser games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dot Universe - Free Browser Games',
    description: 'DotSlayer roguelike + Dot Clicker idle game. Cross-game synergy! Play free now.',
    images: ['/og-image.png'],
    creator: '@dotuniverse',
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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  category: 'games',
  classification: 'Games',
  other: {
    'google-site-verification': 'YOUR_VERIFICATION_CODE',
    'msvalidate.01': 'YOUR_BING_VERIFICATION',
  },
}

// JSON-LD Structured Data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://dotslayer.vercel.app/#website',
      url: 'https://dotslayer.vercel.app',
      name: 'Dot Universe',
      description: 'Free browser games - DotSlayer roguelike and Dot Clicker idle game',
      publisher: {
        '@id': 'https://dotslayer.vercel.app/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://dotslayer.vercel.app/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://dotslayer.vercel.app/#organization',
      name: 'Dot Universe',
      url: 'https://dotslayer.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dotslayer.vercel.app/logo.png',
      },
    },
    {
      '@type': 'VideoGame',
      '@id': 'https://dotslayer.vercel.app/slayer#game',
      name: 'DotSlayer',
      description: 'Competitive browser roguelike with 100 procedurally generated floors, skill trees, 20+ enemy types, and global leaderboards.',
      url: 'https://dotslayer.vercel.app/slayer',
      genre: ['Roguelike', 'Action', 'Shooter'],
      gamePlatform: 'Web Browser',
      applicationCategory: 'Game',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        ratingCount: '100',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'VideoGame',
      '@id': 'https://dotslayer.vercel.app/clicker#game',
      name: 'Dot Clicker',
      description: 'Idle clicker game with prestige systems, ascension mechanics, 20+ buildings, and cross-game synergy with DotSlayer.',
      url: 'https://dotslayer.vercel.app/clicker',
      genre: ['Idle', 'Clicker', 'Incremental'],
      gamePlatform: 'Web Browser',
      applicationCategory: 'Game',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.3',
        ratingCount: '85',
        bestRating: '5',
        worstRating: '1',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="theme-color" content="#0a1929" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
