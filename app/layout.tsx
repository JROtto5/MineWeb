import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../lib/context/AuthContext'
import { GoogleAnalytics } from '../lib/analytics/GoogleAnalytics'

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
    'free online games 2025',
    'free online games 2026',
    'best browser games 2025',
    'best browser games 2026',
    'top web games',
    'play games no download',
    'instant play games',
    'cross game progression',
    'synergy games',
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
      sameAs: [
        'https://twitter.com/dotuniverse',
        'https://discord.gg/dotuniverse',
      ],
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
        ratingCount: '150',
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
        ratingCount: '120',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://dotslayer.vercel.app/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Dot Universe completely free to play?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Both DotSlayer and Dot Clicker are 100% free to play with no downloads, no ads, and no paywalls. Just visit the website and start playing instantly in your browser.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Cross-Game Synergy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cross-Game Synergy is our unique system that rewards you for playing both games. Progress in DotSlayer gives bonuses in Dot Clicker and vice versa. For example, each floor cleared in DotSlayer gives +1% DPS in Clicker, and each prestige in Clicker gives +5% damage in Slayer.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to create an account to play?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can play without an account, but creating a free account (via Google or email) unlocks cloud saves, global leaderboards, achievements tracking, and cross-device syncing so you never lose your progress.',
          },
        },
        {
          '@type': 'Question',
          name: 'What devices can I play Dot Universe on?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Dot Universe works on any device with a modern web browser - PC, Mac, Chromebook, tablets, and mobile phones. Your progress syncs across all devices when logged in.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many floors are in DotSlayer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DotSlayer features 100 procedurally generated floors with increasing difficulty. Boss fights occur every 10 floors, and there are 6 unique themed environments. Can you conquer all 100 floors and become a DotSlayer champion?',
          },
        },
      ],
    },
    {
      '@type': 'HowTo',
      '@id': 'https://dotslayer.vercel.app/#howto',
      name: 'How to Get Started with Dot Universe',
      description: 'Quick guide to start playing free browser games on Dot Universe',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Visit Dot Universe',
          text: 'Go to dotslayer.vercel.app in any web browser',
        },
        {
          '@type': 'HowToStep',
          name: 'Create Free Account (Optional)',
          text: 'Sign up with Google or email to save progress and compete on leaderboards',
        },
        {
          '@type': 'HowToStep',
          name: 'Choose Your Game',
          text: 'Pick DotSlayer for action roguelike gameplay or Dot Clicker for relaxing idle progression',
        },
        {
          '@type': 'HowToStep',
          name: 'Play Both for Synergy Bonuses',
          text: 'Unlock powerful cross-game bonuses by playing both games and building your Dot Universe empire',
        },
      ],
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
        <GoogleAnalytics />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
