'use client'

import Link from 'next/link'

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
  return (
    <div className="news-container">
      <header className="news-header">
        <Link href="/hub" className="back-btn">← Back to Hub</Link>
        <h1>📰 News & Updates</h1>
        <p>Stay up to date with the latest Dot Universe news, updates, and patch notes.</p>
      </header>

      <main className="news-list">
        {NEWS_ITEMS.map((item) => (
          <article key={item.id} className="news-item">
            <div className="news-meta">
              <span className="news-date">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="news-category" style={{ backgroundColor: getCategoryColor(item.category) }}>
                {getCategoryLabel(item.category)}
              </span>
            </div>
            <h2>{item.title}</h2>
            <p className="news-content">{item.content}</p>
            {item.highlights && item.highlights.length > 0 && (
              <ul className="news-highlights">
                {item.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </main>

      <style jsx>{`
        .news-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #050510 0%, #0a0a20 50%, #0a1520 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding: 20px;
        }

        .news-header {
          max-width: 800px;
          margin: 0 auto 40px;
        }

        .back-btn {
          display: inline-block;
          color: #00d9ff;
          text-decoration: none;
          margin-bottom: 20px;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .back-btn:hover {
          color: #fff;
        }

        .news-header h1 {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          background: linear-gradient(135deg, #00d9ff, #ff6b00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .news-header p {
          color: #888;
          font-size: 1.1rem;
          margin: 0;
        }

        .news-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .news-item {
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 25px;
          transition: all 0.3s;
        }

        .news-item:hover {
          border-color: rgba(0, 217, 255, 0.2);
          transform: translateY(-2px);
        }

        .news-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .news-date {
          color: #666;
          font-size: 0.9rem;
        }

        .news-category {
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #fff;
        }

        .news-item h2 {
          font-size: 1.4rem;
          margin: 0 0 12px 0;
          color: #fff;
        }

        .news-content {
          color: #aaa;
          line-height: 1.6;
          margin: 0 0 15px 0;
        }

        .news-highlights {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }

        .news-highlights li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #ccc;
          font-size: 0.95rem;
        }

        .news-highlights li::before {
          content: '✓';
          color: #2ecc71;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .news-header h1 {
            font-size: 1.8rem;
          }
          .news-item {
            padding: 20px;
          }
          .news-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  )
}
