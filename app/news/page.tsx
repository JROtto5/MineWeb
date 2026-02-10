'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewsItem {
  id: string
  date: string
  title: string
  category: 'update' | 'feature' | 'event' | 'bugfix' | 'balance'
  content: string
  highlights?: string[]
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'feb-2026-update',
    date: '2026-02-10',
    title: 'Major Update: Weekly Challenges, Events & More!',
    category: 'feature',
    content: 'We\'re excited to announce a huge update to Dot Universe! This update brings weekly challenges, seasonal events, player profiles, and social sharing features.',
    highlights: [
      'Weekly Challenges: Epic week-long goals with massive rewards',
      'Seasonal Events: Special limited-time events with unique rewards',
      'Player Profiles: View your stats and achievements in one place',
      'Social Sharing: Share your achievements on Twitter/X, Reddit, and Discord',
      'Improved SEO: Better discoverability for new players',
      'Analytics: Better tracking to improve game balance',
    ],
  },
  {
    id: 'feb-5-cleanup',
    date: '2026-02-05',
    title: 'Repository Cleanup & Polish',
    category: 'update',
    content: 'Major cleanup of the codebase, improved code organization, and various polish improvements across both games.',
    highlights: [
      'Cleaner code architecture',
      'Improved loading times',
      'Bug fixes and stability improvements',
    ],
  },
  {
    id: 'feb-4-daily-fix',
    date: '2026-02-04',
    title: 'Daily Challenge System Fix',
    category: 'bugfix',
    content: 'Fixed a bug in the Daily Challenge Manager where state initialization could cause a crash on first load.',
    highlights: [
      'Fixed state initialization bug',
      'Improved error handling',
      'Better offline support',
    ],
  },
  {
    id: 'feb-4-favicon',
    date: '2026-02-04',
    title: 'New Favicon & App Icons',
    category: 'update',
    content: 'Added a proper favicon and Apple touch icon with the DotSlayer logo design for better branding.',
    highlights: [
      'New favicon (16x16 and 32x32)',
      'Apple touch icon (180x180)',
      'Improved PWA manifest icons',
    ],
  },
  {
    id: 'jan-28-supabase',
    date: '2026-01-28',
    title: 'Supabase Backend Integration',
    category: 'feature',
    content: 'Major backend update! Cloud saves, leaderboards, and cross-device syncing are now live with Supabase.',
    highlights: [
      'Cloud saves for both games',
      'Global leaderboards',
      'Cross-device progress syncing',
      'Google OAuth login',
      'Achievement tracking',
      'Daily challenge cloud sync',
    ],
  },
  {
    id: 'jan-28-seo',
    date: '2026-01-28',
    title: 'SEO & Discoverability Update',
    category: 'update',
    content: 'Major SEO improvements to help new players discover Dot Universe through search engines.',
    highlights: [
      'Structured data (JSON-LD)',
      'Open Graph meta tags',
      'Twitter Card support',
      'Sitemap generation',
      'Improved keyword targeting',
    ],
  },
  {
    id: 'jan-28-balance',
    date: '2026-01-28',
    title: 'Dot Clicker Rebalance & Achievements',
    category: 'balance',
    content: 'Rebalanced Dot Clicker economy and added a comprehensive achievement system.',
    highlights: [
      'Building cost rebalancing',
      'Prestige point adjustments',
      'Ascension system tweaks',
      '40+ new achievements',
      'Achievement notifications',
    ],
  },
  {
    id: 'launch',
    date: '2026-01-15',
    title: 'Dot Universe Launch!',
    category: 'event',
    content: 'Welcome to Dot Universe! Two games, one universe. DotSlayer brings intense roguelike action while Dot Clicker offers relaxing idle progression. Play both for cross-game synergy bonuses!',
    highlights: [
      'DotSlayer: 100-floor roguelike with skill trees and bosses',
      'Dot Clicker: Idle game with prestige and ascension',
      'Cross-Game Synergy: Bonuses for playing both games',
      'Procedurally generated music',
      'No downloads, no ads, completely free',
    ],
  },
]

const getCategoryColor = (category: NewsItem['category']) => {
  switch (category) {
    case 'feature': return '#00d9ff'
    case 'update': return '#2ecc71'
    case 'event': return '#f39c12'
    case 'bugfix': return '#e74c3c'
    case 'balance': return '#9b59b6'
    default: return '#888'
  }
}

const getCategoryLabel = (category: NewsItem['category']) => {
  switch (category) {
    case 'feature': return 'New Feature'
    case 'update': return 'Update'
    case 'event': return 'Event'
    case 'bugfix': return 'Bug Fix'
    case 'balance': return 'Balance'
    default: return category
  }
}

export default function NewsPage() {
  const router = useRouter()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [backHovered, setBackHovered] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%)',
      color: 'white',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '20px',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 0, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(46, 204, 113, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <header style={{
        maxWidth: '800px',
        margin: '0 auto 40px',
        position: 'relative',
        zIndex: 10,
      }}>
        <button
          onClick={() => router.push('/hub')}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          style={{
            display: 'inline-block',
            color: backHovered ? '#fff' : '#00d9ff',
            background: 'transparent',
            border: 'none',
            marginBottom: '20px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: 0,
          }}
        >
          ← Back to Hub
        </button>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          margin: '0 0 10px 0',
          background: 'linear-gradient(135deg, #00d9ff, #ff6b00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          News & Updates
        </h1>
        <p style={{
          color: '#888',
          fontSize: '1.1rem',
          margin: 0,
        }}>
          Stay up to date with the latest Dot Universe news, updates, and patch notes.
        </p>
      </header>

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      }}>
        {NEWS_ITEMS.map((item) => (
          <article
            key={item.id}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9))',
              border: hoveredItem === item.id
                ? '1px solid rgba(0, 217, 255, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '25px',
              marginBottom: '25px',
              transition: 'all 0.3s',
              transform: hoveredItem === item.id ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '15px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                color: '#666',
                fontSize: '0.9rem',
              }}>
                {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span style={{
                backgroundColor: getCategoryColor(item.category),
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#fff',
              }}>
                {getCategoryLabel(item.category)}
              </span>
            </div>
            <h2 style={{
              fontSize: '1.4rem',
              margin: '0 0 12px 0',
              color: '#fff',
            }}>
              {item.title}
            </h2>
            <p style={{
              color: '#aaa',
              lineHeight: 1.6,
              margin: '0 0 15px 0',
            }}>
              {item.content}
            </p>
            {item.highlights && item.highlights.length > 0 && (
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '8px',
              }}>
                {item.highlights.map((highlight, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#ccc',
                    fontSize: '0.95rem',
                  }}>
                    <span style={{
                      color: '#2ecc71',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      ✓
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </main>
    </div>
  )
}
