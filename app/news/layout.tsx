import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News & Updates - Dot Universe Changelog',
  description: 'Stay up to date with the latest Dot Universe news, game updates, patch notes, balance changes, and upcoming features for DotSlayer and Dot Clicker.',
  keywords: 'dot universe news, dotslayer updates, dot clicker changelog, game patch notes, browser game updates, new features',
  openGraph: {
    title: 'Dot Universe News & Updates',
    description: 'Latest updates, patch notes, and new features for DotSlayer and Dot Clicker.',
    url: 'https://dotslayer.vercel.app/news',
  },
  alternates: {
    canonical: 'https://dotslayer.vercel.app/news',
  },
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
