import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Player Profile - Stats & Achievements',
  description: 'View your Dot Universe player profile, statistics, and achievements. Track your DotSlayer floors conquered, Dot Clicker prestiges, cross-game synergy level, and unlocked achievements.',
  keywords: 'player profile, gaming stats, achievements, dotslayer stats, dot clicker stats, game progress, leaderboard',
  openGraph: {
    title: 'My Dot Universe Profile',
    description: 'Check out my gaming stats and achievements in Dot Universe!',
    url: 'https://dotslayer.vercel.app/profile',
  },
  robots: {
    index: false, // Don't index user profiles
    follow: true,
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
