import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Dot Universe - Free Browser Games'
export const size = {
  width: 1200,
  height: 600,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.3), transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.25), transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 15,
            marginBottom: 15,
          }}
        >
          <span style={{ fontSize: 50, color: '#00d9ff' }}>●</span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: 6,
              background: 'linear-gradient(135deg, #00d9ff 0%, #ffffff 50%, #ff6b00 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            DOT UNIVERSE
          </span>
          <span style={{ fontSize: 50, color: '#ff6b00' }}>●</span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: '#88c0d0',
            marginBottom: 30,
            letterSpacing: 2,
          }}
        >
          Two Epic Games. One Account. Infinite Fun.
        </p>

        {/* Game badges inline */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '15px 30px',
              background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 50, 0, 0.1))',
              borderRadius: 50,
              border: '2px solid rgba(255, 107, 0, 0.4)',
            }}
          >
            <span style={{ fontSize: 28 }}>⚔</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#ff6b00' }}>DOT SLAYER</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '15px 30px',
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.1))',
              borderRadius: 50,
              border: '2px solid rgba(0, 217, 255, 0.4)',
            }}
          >
            <span style={{ fontSize: 28, color: '#00d9ff' }}>●</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#00d9ff' }}>DOT CLICKER</span>
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 25,
            color: '#aaa',
            fontSize: 16,
          }}
        >
          <span>🎮 Free to Play</span>
          <span>🔗 Cross-Game Synergy</span>
          <span>🏆 Leaderboards</span>
          <span>💾 Cloud Saves</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
