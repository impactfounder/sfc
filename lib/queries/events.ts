import { SupabaseClient } from "@supabase/supabase-js"

export type EventForDisplay = {
  id: string
  title: string
  thumbnail_url?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  max_participants?: number | null
  current_participants: number
  event_type?: 'networking' | 'class' | 'activity' | null
  // 호스트 정보
  host_name?: string | null
  host_avatar_url?: string | null
}

/**
 * 다가오는 이벤트 목록 가져오기
 */
export async function getUpcomingEvents(
  supabase: SupabaseClient,
  limit: number = 9
): Promise<EventForDisplay[]> {
  // 오늘 날짜의 시작 시간을 계산 (시간대 문제 방지)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      thumbnail_url,
      event_date,
      location,
      max_participants,
      event_type,
      event_registrations (count),
      profiles:created_by (
        full_name,
        avatar_url
      )
    `)
    .gte("event_date", todayStart)
    .order("event_date", { ascending: true })
    .limit(limit)

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching events:", (error as any)?.message || error)
    }
    return []
  }

  return (data || []).map((event: any) => {
    // 배열/객체 모두 대응
    const profile = Array.isArray(event.profiles)
      ? event.profiles[0]
      : event.profiles;

    return {
      id: event.id,
      title: event.title,
      thumbnail_url: event.thumbnail_url,
      event_date: event.event_date,
      // event_time 컬럼이 없는 스키마 대응 (null로 채워서 타입 충족)
      event_time: null,
      location: event.location,
      max_participants: event.max_participants,
      current_participants: event.event_registrations?.[0]?.count || 0,
      event_type: event.event_type || 'networking',
      // 호스트 정보 매핑
      host_name: profile?.full_name || null,
      host_avatar_url: profile?.avatar_url || null,
    }
  })
}

