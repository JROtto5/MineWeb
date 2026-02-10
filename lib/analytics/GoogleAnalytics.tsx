'use client'

import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  )
}

// Analytics event tracking functions
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
    (window as unknown as { gtag: Function }).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Game-specific tracking events
export const analytics = {
  // DotSlayer events
  slayer: {
    gameStart: (characterClass: string) =>
      trackEvent('game_start', 'DotSlayer', characterClass),
    floorComplete: (floor: number) =>
      trackEvent('floor_complete', 'DotSlayer', `Floor ${floor}`, floor),
    bossKill: (bossName: string, floor: number) =>
      trackEvent('boss_kill', 'DotSlayer', bossName, floor),
    gameOver: (floor: number, score: number) =>
      trackEvent('game_over', 'DotSlayer', `Floor ${floor}`, score),
    victory: (score: number) =>
      trackEvent('victory', 'DotSlayer', 'Game Won', score),
    achievementUnlock: (achievement: string) =>
      trackEvent('achievement', 'DotSlayer', achievement),
    skillUnlock: (skill: string) =>
      trackEvent('skill_unlock', 'DotSlayer', skill),
    shopPurchase: (item: string, cost: number) =>
      trackEvent('purchase', 'DotSlayer', item, cost),
  },

  // Dot Clicker events
  clicker: {
    gameStart: () =>
      trackEvent('game_start', 'DotClicker'),
    prestige: (tier: number, dots: number) =>
      trackEvent('prestige', 'DotClicker', `Tier ${tier}`, Math.floor(dots)),
    ascension: (level: number) =>
      trackEvent('ascension', 'DotClicker', `Level ${level}`, level),
    buildingPurchase: (building: string, count: number) =>
      trackEvent('building_purchase', 'DotClicker', building, count),
    milestone: (milestone: string, value: number) =>
      trackEvent('milestone', 'DotClicker', milestone, value),
  },

  // Cross-game events
  synergy: {
    bonusUnlock: (bonus: string, value: number) =>
      trackEvent('synergy_bonus', 'CrossGame', bonus, value),
    levelUp: (level: number) =>
      trackEvent('synergy_level', 'CrossGame', `Level ${level}`, level),
  },

  // User events
  user: {
    signUp: (method: string) =>
      trackEvent('sign_up', 'User', method),
    login: (method: string) =>
      trackEvent('login', 'User', method),
    profileUpdate: () =>
      trackEvent('profile_update', 'User'),
  },

  // Engagement events
  engagement: {
    pageView: (page: string) =>
      trackEvent('page_view', 'Engagement', page),
    sessionTime: (minutes: number) =>
      trackEvent('session_time', 'Engagement', `${minutes} minutes`, minutes),
    returnVisit: (daysSinceLastVisit: number) =>
      trackEvent('return_visit', 'Engagement', `${daysSinceLastVisit} days`, daysSinceLastVisit),
    shareClick: (platform: string) =>
      trackEvent('share', 'Engagement', platform),
  },
}

export default GoogleAnalytics
