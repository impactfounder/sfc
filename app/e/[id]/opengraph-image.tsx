import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { buildEventQueryFromShortCode } from '@/lib/utils/event-url'

export const runtime = 'edge'

// 이벤트 ID를 찾는 헬퍼 함수
async function findEventId(id: string, supabase: any): Promise<string | null> {
  // 짧은 코드(6자)인 경우 날짜 + 순서번호로 이벤트 찾기
  if (id.length === 6) {
    const query = buildEventQueryFromShortCode(id)
    if (!query) {
      return null
    }
    
    const { month, day, orderNumber } = query
    
    const { data: allEventsForDate } = await supabase
      .from("events")
      .select("id, event_date, created_at")
      .order("created_at", { ascending: true })
    
    if (!allEventsForDate || allEventsForDate.length === 0) {
      return null
    }
    
    const allMatchingEvents = allEventsForDate.filter((event: any) => {
      const eventDate = new Date(event.event_date)
      const eventMonth = eventDate.getMonth() + 1
      const eventDay = eventDate.getDate()
      return eventMonth === month && eventDay === day
    })
    
    allMatchingEvents.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    })
    
    if (allMatchingEvents.length >= orderNumber) {
      return allMatchingEvents[orderNumber - 1].id
    }
    
    return null
  } else {
    // 전체 UUID인 경우
    return id
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const eventId = await findEventId(id, supabase)
  
  if (!eventId) {
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

  const { data: event } = await supabase
    .from('events')
    .select('title, event_date, location, thumbnail_url, profiles(full_name)')
    .eq('id', eventId)
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

  // 썸네일이 없으면 텍스트 기반 이미지 생성
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

