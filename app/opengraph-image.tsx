import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Seoul Founders Club'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  // 원형 로고 이미지를 로드
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seoulfounders.club'
  const logoUrl = `${baseUrl}/images/logo-circle.png`
  
  try {
    const logoResponse = await fetch(logoUrl, {
      cache: 'no-store',
    })
    
    if (logoResponse.ok) {
      // Edge runtime에서는 직접 이미지 URL을 사용
      return new ImageResponse(
        (
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 원형 로고를 중앙에 배치 */}
            <img
              src={logoUrl}
              alt="Seoul Founders Club Logo"
              style={{
                width: '500px',
                height: '500px',
                objectFit: 'contain',
              }}
            />
          </div>
        ),
        { 
          ...size,
          // 이미지 로드 허용
        }
      )
    }
  } catch (error) {
    console.error('OG 이미지 생성 오류:', error)
  }

  // 이미지를 로드할 수 없으면 기본 배경만 표시
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: '#0f172a',
          background: '#f8fafc',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
      >
        Seoul Founders Club
      </div>
    ),
    { ...size }
  )
}

