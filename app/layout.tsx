import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../lib/context/AuthContext'

export const metadata: Metadata = {
  title: 'DotSlayer - Free Competitive Browser Roguelike',
  description: 'Compete on global leaderboards in DotSlayer! 100 procedurally generated floors, skill trees, and intense dot-slaying action. No download required - play instantly in your browser.',
  keywords: [
    'dotslayer',
    'free browser game',
    'online roguelike',
    'competitive browser game',
    'procedural dungeon crawler',
    'no download game',
    'skill tree game',
    'global leaderboard game',
    'web roguelike',
    'dungeon crawler browser',
    'free online game',
    'browser action game',
    'sci-fi shooter',
    'phaser game',
    'javascript game',
  ].join(', '),
  authors: [{ name: 'DotSlayer Team' }],
  creator: 'DotSlayer Team',
  publisher: 'DotSlayer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dotslayer.vercel.app'),
  openGraph: {
    title: 'DotSlayer - Competitive Browser Roguelike',
    description: 'Climb 100 floors, compete globally, dominate the leaderboards! Free browser roguelike with procedurally generated dungeons.',
    url: 'https://dotslayer.vercel.app',
    siteName: 'DotSlayer',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DotSlayer gameplay screenshot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DotSlayer - Free Competitive Roguelike',
    description: '100 floors of procedurally generated action. Compete on global leaderboards!',
    images: ['/og-image.png'],
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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
