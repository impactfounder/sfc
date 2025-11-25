import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('title, event_date, location, profiles(full_name)')
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
          {event.profiles?.full_name && (
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255, 255, 255, 0.85)',
                marginTop: 20,
                paddingTop: 20,
                borderTop: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              Hosted by {event.profiles.full_name}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

