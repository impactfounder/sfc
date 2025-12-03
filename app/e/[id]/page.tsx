import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from "@/lib/supabase/server"
import { buildEventQueryFromShortCode } from "@/lib/utils/event-url"
import EventDetailContent from "@/components/event-detail-content"

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  const eventId = await findEventId(id, supabase);
  
  if (!eventId) {
    return {
      title: '이벤트를 찾을 수 없습니다',
    };
  }

  try {
    const { data: event } = await supabase
      .from("events")
      .select(`
        title,
        description,
        thumbnail_url,
        event_date,
        location
      `)
      .eq("id", eventId)
      .single();

    if (!event) {
      return {
        title: '이벤트를 찾을 수 없습니다',
      };
    }

    // 날짜 포맷팅
    const eventDate = new Date(event.event_date);
    const dateStr = eventDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    // HTML 태그 제거 및 텍스트 정리
    const plainDescription = event.description?.replace(/<[^>]*>/g, "").substring(0, 200) || event.title;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";

    return {
      title: event.title,
      description: `${dateStr} · ${event.location}\n${plainDescription}`,
      openGraph: {
        title: event.title,
        description: `${dateStr} · ${event.location}`,
        images: event.thumbnail_url ? [
          {
            url: event.thumbnail_url,
            width: 1200,
            height: 630,
            alt: event.title,
          }
        ] : [
          {
            url: `${baseUrl}/e/${id}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: event.title,
          }
        ],
        type: 'website',
        siteName: 'Seoul Founders Club',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: `${dateStr} · ${event.location}`,
        images: event.thumbnail_url ? [event.thumbnail_url] : [`${baseUrl}/e/${id}/opengraph-image`],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: 'Seoul Founders Club',
    };
  }
}

export default async function ShortEventPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    
    let eventId: string;
    
    // 짧은 코드(6자)인 경우 날짜 + 순서번호로 이벤트 찾기
    if (id.length === 6) {
        const query = buildEventQueryFromShortCode(id)
        if (!query) {
            console.error(`[ShortCode] 파싱 실패: ${id}`)
            notFound();
        }
        
        const { month, day, orderNumber } = query
        
        console.log(`[ShortCode] 파싱 결과: month=${month}, day=${day}, orderNumber=${orderNumber}`)
        
        // 연도와 상관없이 해당 MMdd에 해당하는 모든 이벤트 찾기
        // 최신 연도부터 최근 10년까지 검색 (성능 최적화)
        const currentYear = new Date().getFullYear()
        let allMatchingEvents: any[] = []
        
        // 최신 연도부터 최근 10년까지 검색
        // event_date 기준으로 검색 (이벤트가 열리는 날짜 기준)
        // 날짜 부분만 비교하기 위해 모든 이벤트를 가져온 후 필터링
        const { data: allEventsForDate, error: fetchError } = await supabase
            .from("events")
            .select("id, event_date, created_at")
            .order("created_at", { ascending: true })
        
        if (fetchError) {
            console.error(`[ShortCode] 이벤트 조회 에러:`, fetchError)
            notFound();
        }
        
        // 날짜 부분만 비교하여 필터링 (시간대 무시)
        if (allEventsForDate && allEventsForDate.length > 0) {
            allEventsForDate.forEach((event) => {
                const eventDate = new Date(event.event_date)
                const eventYear = eventDate.getFullYear()
                const eventMonth = eventDate.getMonth() + 1
                const eventDay = eventDate.getDate()
                
                // MMdd가 일치하는 이벤트만 추가
                if (eventMonth === month && eventDay === day) {
                    allMatchingEvents.push(event)
                }
            })
        }
        
        console.log(`[ShortCode] 날짜 필터링 결과: ${allMatchingEvents.length}개 이벤트 발견 (${month}월 ${day}일)`)
        
        // 모든 연도에서 찾은 이벤트들을 created_at 순서로 정렬 (같은 날짜의 이벤트 순서 결정)
        allMatchingEvents.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return dateA - dateB
        })
        
        // 디버깅: 찾은 이벤트 수와 요청한 순서번호 확인
        console.log(`[ShortCode] 총 찾은 이벤트 수: ${allMatchingEvents.length}, 요청한 순서번호: ${orderNumber}`)
        if (allMatchingEvents.length > 0) {
            console.log(`[ShortCode] 이벤트 목록:`, allMatchingEvents.map((e, idx) => ({ 
                index: idx + 1,
                id: e.id.substring(0, 8), 
                created_at: e.created_at,
                event_date: e.event_date
            })))
        }
        
        if (allMatchingEvents.length >= orderNumber) {
            // 순서번호에 해당하는 이벤트 (1-based index)
            const matchingEvent = allMatchingEvents[orderNumber - 1]
            if (matchingEvent) {
                console.log(`[ShortCode] 매칭된 이벤트: ${matchingEvent.id.substring(0, 8)}`)
                eventId = matchingEvent.id
            } else {
                console.error(`[ShortCode] 순서번호 ${orderNumber}에 해당하는 이벤트를 찾을 수 없습니다.`)
                notFound();
            }
        } else {
            console.error(`[ShortCode] 찾은 이벤트 수(${allMatchingEvents.length})가 요청한 순서번호(${orderNumber})보다 적습니다.`)
            
            // 디버깅: 실제로 존재하는 이벤트들의 event_date 확인
            const { data: allEvents } = await supabase
                .from("events")
                .select("id, created_at, event_date, title")
                .order("event_date", { ascending: false })
                .limit(20)
            
            if (allEvents && allEvents.length > 0) {
                console.log(`[ShortCode] 최근 이벤트 목록 (event_date 기준, 참고용):`)
                allEvents.forEach((e, idx) => {
                    const eventDate = new Date(e.event_date)
                    const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0')
                    const eventDay = String(eventDate.getDate()).padStart(2, '0')
                    const createdDate = new Date(e.created_at)
                    const createdMonth = String(createdDate.getMonth() + 1).padStart(2, '0')
                    const createdDay = String(createdDate.getDate()).padStart(2, '0')
                    console.log(`  ${idx + 1}. ${e.title?.substring(0, 30)}`)
                    console.log(`      - event_date: ${eventDate.toISOString().split('T')[0]} (${eventMonth}${eventDay}XX)`)
                    console.log(`      - created_at: ${createdDate.toISOString().split('T')[0]} (${createdMonth}${createdDay}XX)`)
                })
                
                // 1월 1일 이벤트가 있는지 확인
                const jan1Events = allEvents.filter(e => {
                    const d = new Date(e.event_date)
                    return d.getMonth() === 0 && d.getDate() === 1
                })
                console.log(`[ShortCode] 1월 1일 event_date를 가진 이벤트: ${jan1Events.length}개`)
                if (jan1Events.length > 0) {
                    jan1Events.forEach((e, idx) => {
                        const eventDate = new Date(e.event_date)
                        console.log(`  ${idx + 1}. ${e.title} - event_date: ${eventDate.toISOString()}`)
                    })
                }
            }
            
            notFound();
        }
    } else {
        // 전체 UUID인 경우
        eventId = id
    }
    
    // 이벤트 ID로 상세 페이지 렌더링
    return <EventDetailContent eventId={eventId} basePath="/e" />
}
