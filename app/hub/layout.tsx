import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Game Hub - Dot Universe',
  description: 'Your Dot Universe hub! Access DotSlayer roguelike and Dot Clicker idle game. View your stats, cross-game synergy bonuses, and achievements.',
  openGraph: {
    title: 'Dot Universe Game Hub',
    description: 'Access all Dot Universe games from one place. Track your progress and synergy bonuses!',
    url: 'https://dotslayer.vercel.app/hub',
  },
  alternates: {
    canonical: 'https://dotslayer.vercel.app/hub',
  },
}

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
