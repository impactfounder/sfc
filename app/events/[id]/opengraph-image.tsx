import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('title, event_date, location, thumbnail_url, profiles(full_name)')
    .eq('id', id)
    .single()

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 40,
            color: 'black',
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Event Not Found
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const eventDate = new Date(event.event_date)
  const dateStr = eventDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const hostProfile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles

  // 썸네일이 있으면 썸네일을 사용, 없으면 텍스트 기반 이미지 생성
  if (event.thumbnail_url) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
          }}
        >
          <img
            src={event.thumbnail_url}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* 오버레이 - 제목과 날짜 표시 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              padding: '60px 80px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.2,
              }}
            >
              {event.title}
            </div>
            <div
              style={{
                fontSize: 32,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {dateStr} · {event.location}
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: 'black',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          padding: '50px 200px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* 배경 패턴 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            opacity: 0.3,
          }}
        />

        {/* 메인 컨텐츠 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            width: '100%',
          }}
        >
          {/* 로고/브랜드 */}
          <div
            style={{
              fontSize: 24,
              color: 'white',
              marginBottom: 30,
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            Seoul Founders Club
          </div>

          {/* 이벤트 제목 */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 30,
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {event.title}
          </div>

          {/* 날짜 및 장소 */}
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div>{dateStr}</div>
            {event.location && (
              <div style={{ fontSize: 28, opacity: 0.9 }}>{event.location}</div>
            )}
          </div>

          {/* 호스트 정보 */}
          {hostProfile?.full_name && (
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255, 255, 255, 0.85)',
                marginTop: 20,
                paddingTop: 20,
                borderTop: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              Hosted by {hostProfile.full_name}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

