import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crime City: Underground Empire - Free Online Shooting Game',
  description: 'Play Crime City for free! Top-down roguelike shooter with skill trees, upgrades, and global leaderboards. No download required - play instantly in your browser.',
  keywords: [
    'free browser game',
    'online shooting game',
    'no download game',
    'browser shooter',
    'roguelike shooter',
    'skill tree game',
    'free online game',
    'top down shooter',
    'web game',
    'casual shooter',
    'browser action game',
    'free shooter game',
    'online arcade game',
    'phaser game',
    'javascript game',
  ].join(', '),
  authors: [{ name: 'Crime City Team' }],
  creator: 'Crime City Team',
  publisher: 'Crime City',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://crime-city-game.vercel.app'),
  openGraph: {
    title: 'Crime City: Underground Empire',
    description: 'Free browser shooting game with roguelike progression. Compete on global leaderboards!',
    url: 'https://crime-city-game.vercel.app',
    siteName: 'Crime City',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Crime City gameplay screenshot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crime City: Free Online Shooter',
    description: 'Play free roguelike shooter in your browser. No download needed!',
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
      <body>{children}</body>
    </html>
  )
}
