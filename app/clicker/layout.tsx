import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dot Clicker - Free Idle Clicker Game',
  description: 'Play Dot Clicker free! Build your dot empire with 20+ buildings, 7 prestige tiers, ascension system, and cross-game synergy. Idle game with offline progress!',
  keywords: 'dot clicker, idle game, clicker game, incremental game, prestige system, ascension, offline game, browser game, free idle game',
  openGraph: {
    title: 'Dot Clicker - Idle Incremental Game',
    description: '20+ buildings, 7 prestige tiers, ascension system. Build your dot empire! Free to play.',
    url: 'https://dotslayer.vercel.app/clicker',
    images: ['/og-clicker.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dot Clicker - Free Idle Game',
    description: 'Prestige system, ascension, offline progress. Play free!',
  },
  alternates: {
    canonical: 'https://dotslayer.vercel.app/clicker',
  },
}

export default function ClickerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
