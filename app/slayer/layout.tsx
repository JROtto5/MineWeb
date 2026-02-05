import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DotSlayer - Free Browser Roguelike Game',
  description: 'Play DotSlayer free! Battle through 100 procedurally generated floors, face 20+ enemy types, unlock upgrades, and compete on global leaderboards. No download - play instantly!',
  keywords: 'dotslayer, free roguelike, browser roguelike, procedural dungeon, action game, shooter game, leaderboard game, skill tree, boss battles, web game',
  openGraph: {
    title: 'DotSlayer - Competitive Browser Roguelike',
    description: 'Battle 100 floors of procedurally generated action! 20+ enemies, skill trees, global leaderboards. Play free now!',
    url: 'https://dotslayer.vercel.app/slayer',
    images: ['/og-slayer.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DotSlayer - Free Browser Roguelike',
    description: '100 floors, 20+ enemies, global leaderboards. Play free!',
  },
  alternates: {
    canonical: 'https://dotslayer.vercel.app/slayer',
  },
}

export default function SlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
