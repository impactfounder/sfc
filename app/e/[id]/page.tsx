import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from "@/lib/supabase/server"
import EventDetailContent from "@/components/event-detail-content"

// ISR: 60초마다 재검증
export const revalidate = 60

async function findEventId(shortCode: string, supabase: any): Promise<string | null> {
  // 1. 코드가 6자리가 아니면 그대로 UUID로 간주
  if (shortCode.length !== 6) return shortCode

  try {
    // 2. URL 파싱 (예: 010194 -> 1월 1일, 접두사 94)
    const targetMonth = parseInt(shortCode.substring(0, 2), 10)
    const targetDay = parseInt(shortCode.substring(2, 4), 10)
    const idSuffix = shortCode.substring(4, 6).toLowerCase()
    const orderNumber = parseInt(idSuffix, 10) // 혹시 모를 순서번호 방식 대비

    // 3. 여러 연도에서 해당 날짜의 이벤트만 조회 (DB 필터링으로 최적화)
    const currentYear = new Date().getFullYear()
    const yearsToCheck = [currentYear, currentYear - 1, currentYear + 1] // 올해, 작년, 내년

    let allDateEvents: any[] = []

    for (const year of yearsToCheck) {
      const monthStr = String(targetMonth).padStart(2, '0')
      const dayStr = String(targetDay).padStart(2, '0')
      const startDate = `${year}-${monthStr}-${dayStr}T00:00:00`
      const endDate = `${year}-${monthStr}-${dayStr}T23:59:59`

      const { data: yearEvents } = await supabase
        .from("events")
        .select("id, event_date")
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("created_at", { ascending: true })

      if (yearEvents && yearEvents.length > 0) {
        allDateEvents.push(...yearEvents)
      }
    }

    if (allDateEvents.length === 0) return null

    // 4. ID 앞 2자리가 일치하는 이벤트 찾기
    const matchedEvent = allDateEvents.find((event: any) => {
      const eventIdPrefix = event.id.substring(0, 2).toLowerCase()
      return eventIdPrefix === idSuffix
    })

    if (matchedEvent) {
      return matchedEvent.id
    }

    // 5. 못 찾았다면 '순서번호' 방식(구버전 URL)으로 한 번 더 찾기
    if (allDateEvents.length >= orderNumber) {
      return allDateEvents[orderNumber - 1].id
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
