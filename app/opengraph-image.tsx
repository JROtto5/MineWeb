import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Dot Universe - Free Browser Games'
export const size = {
  width: 1200,
  height: 630,
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
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.3), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.25), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 60, color: '#00d9ff' }}>●</span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: 8,
              background: 'linear-gradient(135deg, #00d9ff 0%, #ffffff 50%, #ff6b00 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            DOT UNIVERSE
          </span>
          <span style={{ fontSize: 60, color: '#ff6b00' }}>●</span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: '#88c0d0',
            marginBottom: 40,
            letterSpacing: 2,
          }}
        >
          Two Epic Games. One Account. Infinite Fun.
        </p>

        {/* Game Cards */}
        <div
          style={{
            display: 'flex',
            gap: 40,
          }}
        >
          {/* DotSlayer Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '30px 50px',
              background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.9), rgba(10, 15, 30, 0.95))',
              borderRadius: 24,
              border: '2px solid rgba(255, 107, 0, 0.4)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ff8844, #ff6b00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 15,
                boxShadow: '0 0 40px rgba(255, 107, 0, 0.5)',
              }}
            >
              <span style={{ fontSize: 40, color: 'white' }}>⚔</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#ff6b00', letterSpacing: 3 }}>
              DOT SLAYER
            </span>
            <span style={{ fontSize: 16, color: '#889', marginTop: 5 }}>100 Floors of Action</span>
          </div>

          {/* DotClicker Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '30px 50px',
              background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.9), rgba(10, 15, 30, 0.95))',
              borderRadius: 24,
              border: '2px solid rgba(0, 217, 255, 0.4)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #00ffff, #00d9ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 15,
                boxShadow: '0 0 40px rgba(0, 217, 255, 0.5)',
              }}
            >
              <span style={{ fontSize: 50, color: 'white' }}>●</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#00d9ff', letterSpacing: 3 }}>
              DOT CLICKER
            </span>
            <span style={{ fontSize: 16, color: '#889', marginTop: 5 }}>Infinite Idle Empire</span>
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            marginTop: 40,
            color: '#aaa',
            fontSize: 18,
          }}
        >
          <span>🎮 Free to Play</span>
          <span>🔗 Cross-Game Synergy</span>
          <span>🏆 Global Leaderboards</span>
          <span>💾 Cloud Saves</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
