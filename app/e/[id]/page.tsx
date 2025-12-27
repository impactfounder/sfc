import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from "@/lib/supabase/server"
import { buildEventQueryFromShortCode } from "@/lib/utils/event-url"
import EventDetailContent from "@/components/event-detail-content"

// ISR: 5분마다 재검증 (이벤트 상세는 자주 안 바뀜)
export const revalidate = 300

// 이벤트 ID를 찾는 헬퍼 함수 (최적화됨 + KST/UTC 타임존 지원)
async function findEventId(id: string, supabase: any): Promise<string | null> {
  // 짧은 코드(6자)인 경우
  if (id.length === 6) {
    const month = parseInt(id.substring(0, 2), 10)
    const day = parseInt(id.substring(2, 4), 10)
    const idPrefix = id.substring(4, 6)

    // 1. ID 접두사로 먼저 검색 (가장 확실한 필터)
    const { data: eventsById } = await supabase
      .from("events")
      .select("id, event_date")
      .ilike("id", `${idPrefix}%`)
      .limit(50)

    if (eventsById && eventsById.length > 0) {
      // 2. 날짜 매칭 (UTC와 KST 모두 확인)
      const match = eventsById.find((event: any) => {
        const eventDate = new Date(event.event_date)

        // A. UTC 기준 확인
        const utcMonth = eventDate.getUTCMonth() + 1
        const utcDay = eventDate.getUTCDate()

        // B. KST 기준 확인 (UTC + 9시간)
        const kstDate = new Date(eventDate.getTime() + 9 * 60 * 60 * 1000)
        const kstMonth = kstDate.getUTCMonth() + 1
        const kstDay = kstDate.getUTCDate()

        // 둘 중 하나라도 URL의 날짜와 맞으면 통과
        return (utcMonth === month && utcDay === day) || (kstMonth === month && kstDay === day)
      })

      if (match) {
        return match.id
      }
    }

    // 새 형식으로 못 찾으면 기존 형식(순서번호)으로 폴백
    const query = buildEventQueryFromShortCode(id)
    if (!query) {
      return null
    }

    const { orderNumber } = query

    // 해당 날짜의 이벤트만 조회
    const { data: allEventsForDate } = await supabase
      .from("events")
      .select("id, event_date, created_at")
      .order("created_at", { ascending: true })

    if (!allEventsForDate || allEventsForDate.length === 0) {
      return null
    }

    // KST 기준으로 날짜 매칭
    const allMatchingEvents = allEventsForDate.filter((event: any) => {
      const eventDate = new Date(event.event_date)

      // UTC 기준
      const utcMonth = eventDate.getUTCMonth() + 1
      const utcDay = eventDate.getUTCDate()

      // KST 기준 (UTC + 9시간)
      const kstDate = new Date(eventDate.getTime() + 9 * 60 * 60 * 1000)
      const kstMonth = kstDate.getUTCMonth() + 1
      const kstDay = kstDate.getUTCDate()

      return (utcMonth === month && utcDay === day) || (kstMonth === month && kstDay === day)
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

    // findEventId 헬퍼 함수 재사용 (최적화된 검색)
    const eventId = await findEventId(id, supabase);

    if (!eventId) {
        notFound();
    }

    // 이벤트 ID로 상세 페이지 렌더링
    return <EventDetailContent eventId={eventId} basePath="/e" />
}
