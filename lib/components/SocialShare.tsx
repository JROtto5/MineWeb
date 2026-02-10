'use client'

import { useState } from 'react'
import { analytics } from '../analytics/GoogleAnalytics'

interface ShareData {
  title: string
  text: string
  url?: string
  score?: number
  floor?: number
  game: 'slayer' | 'clicker'
}

interface SocialShareProps {
  data: ShareData
  onClose?: () => void
  compact?: boolean
}

export function SocialShare({ data, onClose, compact = false }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(!compact)

  const shareUrl = data.url || 'https://dotslayer.vercel.app'

  const shareText = data.game === 'slayer'
    ? `I just reached Floor ${data.floor} with ${data.score?.toLocaleString()} points in DotSlayer! Can you beat my score? Play free at ${shareUrl}`
    : `I clicked ${data.score?.toLocaleString()} dots in Dot Clicker! Join the dot empire at ${shareUrl}`

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=DotUniverse,BrowserGames,DotSlayer`

  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(data.title)}`

  const discordText = `**${data.title}**\n${shareText}`

  const handleShare = async (platform: string) => {
    analytics.engagement.shareClick(platform)

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        console.log('Share cancelled')
      }
      return
    }

    if (platform === 'twitter') {
      window.open(twitterUrl, '_blank', 'width=600,height=400')
    } else if (platform === 'reddit') {
      window.open(redditUrl, '_blank', 'width=600,height=400')
    } else if (platform === 'discord') {
      // Copy discord-formatted text
      await navigator.clipboard.writeText(discordText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (compact) {
    return (
      <div className="share-compact">
        <button onClick={() => handleShare('twitter')} className="share-btn twitter" title="Share on Twitter/X">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>
        <button onClick={() => handleShare('reddit')} className="share-btn reddit" title="Share on Reddit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
        </button>
        <button onClick={() => handleShare('discord')} className="share-btn discord" title="Copy for Discord">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </button>
        <button onClick={() => handleShare('copy')} className="share-btn copy" title="Copy Link">
          {copied ? '✓' : '📋'}
        </button>
        <style jsx>{`
          .share-compact {
            display: flex;
            gap: 8px;
          }
          .share-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            color: white;
          }
          .share-btn:hover {
            transform: scale(1.1);
          }
          .twitter { background: #1da1f2; }
          .reddit { background: #ff4500; }
          .discord { background: #5865f2; }
          .copy { background: #333; font-size: 16px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="share-modal-overlay" onClick={() => onClose?.()}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={() => onClose?.()}>×</button>

        <h2>Share Your Achievement!</h2>
        <p className="share-preview">{shareText}</p>

        <div className="share-buttons">
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={() => handleShare('native')} className="share-option native">
              <span className="icon">📤</span>
              <span>Share</span>
            </button>
          )}

          <button onClick={() => handleShare('twitter')} className="share-option twitter">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Twitter/X</span>
          </button>

          <button onClick={() => handleShare('reddit')} className="share-option reddit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
            </svg>
            <span>Reddit</span>
          </button>

          <button onClick={() => handleShare('discord')} className="share-option discord">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Discord</span>
          </button>

          <button onClick={() => handleShare('copy')} className="share-option copy">
            <span className="icon">{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <style jsx>{`
          .share-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .share-modal {
            background: linear-gradient(145deg, #1a1a2e, #16213e);
            border: 1px solid rgba(0, 217, 255, 0.3);
            border-radius: 20px;
            padding: 30px;
            max-width: 450px;
            width: 90%;
            position: relative;
            animation: slideUp 0.3s;
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: #888;
            font-size: 28px;
            cursor: pointer;
            transition: color 0.2s;
          }
          .close-btn:hover {
            color: #fff;
          }
          h2 {
            color: #00d9ff;
            margin: 0 0 15px 0;
            font-size: 1.5rem;
          }
          .share-preview {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            color: #aaa;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 25px;
          }
          .share-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 12px;
          }
          .share-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 15px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            color: white;
          }
          .share-option:hover {
            transform: translateY(-3px);
          }
          .share-option .icon {
            font-size: 24px;
          }
          .share-option span:last-child {
            font-size: 0.85rem;
            font-weight: 600;
          }
          .twitter { background: linear-gradient(135deg, #1da1f2, #0d8bd9); }
          .reddit { background: linear-gradient(135deg, #ff4500, #e03d00); }
          .discord { background: linear-gradient(135deg, #5865f2, #4752c4); }
          .copy { background: linear-gradient(135deg, #333, #222); }
          .native { background: linear-gradient(135deg, #00d9ff, #0099cc); }
        `}</style>
      </div>
    </div>
  )
}

export default SocialShare
