import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from "@/lib/supabase/server"
import EventDetailContent from "@/components/event-detail-content"

// 디버깅을 위해 캐시를 끕니다. (해결되면 300으로 변경)
export const revalidate = 0

async function findEventId(shortCode: string, supabase: any): Promise<string | null> {
  // 1. 코드가 6자리가 아니면 그대로 UUID로 간주
  if (shortCode.length !== 6) return shortCode

  try {
    // 2. URL 파싱 (예: 010194 -> 1월 1일, 접두사 94)
    const targetMonth = parseInt(shortCode.substring(0, 2), 10)
    const targetDay = parseInt(shortCode.substring(2, 4), 10)
    const idSuffix = shortCode.substring(4, 6).toLowerCase()
    const orderNumber = parseInt(idSuffix, 10) // 혹시 모를 순서번호 방식 대비

    console.log(`🔍 검색: ${targetMonth}월 ${targetDay}일, ID: ${idSuffix}...`)

    // 3. 핵심: 조건 없이 모든 이벤트를 가져옵니다. (DB 필터링 오류 배제)
    const { data: allEvents } = await supabase
      .from("events")
      .select("id, event_date")
      .order("created_at", { ascending: true })

    if (!allEvents) return null

    // 4. 자바스크립트로 직접 하나씩 비교 (가장 정확함)
    const matchedEvent = allEvents.find((event: any) => {
      const date = new Date(event.event_date)

      // UTC 기준 날짜 확인
      const utcMonth = date.getUTCMonth() + 1
      const utcDay = date.getUTCDate()

      // KST 기준 날짜 확인 (UTC+9)
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
      const kstMonth = kstDate.getUTCMonth() + 1
      const kstDay = kstDate.getUTCDate()

      // 날짜가 맞는지 확인 (UTC나 KST 둘 중 하나라도 맞으면 OK)
      const isDateMatch = (utcMonth === targetMonth && utcDay === targetDay) ||
        (kstMonth === targetMonth && kstDay === targetDay)

      if (!isDateMatch) return false

      // 5. ID 앞 2자리가 일치하는지 확인 (94...)
      const eventIdPrefix = event.id.substring(0, 2).toLowerCase()
      return eventIdPrefix === idSuffix
    })

    if (matchedEvent) {
      console.log(`✅ 찾음! ID: ${matchedEvent.id}`)
      return matchedEvent.id
    }

    // 6. 못 찾았다면 '순서번호' 방식(구버전 URL)으로 한 번 더 찾기
    const dateEvents = allEvents.filter((event: any) => {
      const date = new Date(event.event_date)
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
      return kstDate.getUTCMonth() + 1 === targetMonth && kstDate.getUTCDate() === targetDay
    })

    if (dateEvents.length >= orderNumber) {
      return dateEvents[orderNumber - 1].id
    }

    return null

  } catch (error) {
    console.error("Error finding event:", error)
    return null
  }
}

// 메타데이터 생성 (미리보기)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const eventId = await findEventId(id, supabase);

  if (!eventId) return { title: '이벤트를 찾을 수 없습니다' };

  const { data: event } = await supabase.from("events").select("title, thumbnail_url").eq("id", eventId).single();
  return {
    title: event?.title,
    openGraph: { images: event?.thumbnail_url ? [event.thumbnail_url] : [] },
  };
}

export default async function ShortEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const eventId = await findEventId(id, supabase);

  if (!eventId) {
    notFound();
  }

  return <EventDetailContent eventId={eventId} basePath="/e" />
}
