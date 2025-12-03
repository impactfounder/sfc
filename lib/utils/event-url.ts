/**
 * 이벤트 URL 관련 유틸리티 함수
 * 날짜 기반 짧은 코드 생성 및 파싱
 * 형식: MMdd + 순서번호(01, 02, 03...)
 * 예: 121901 -> 12월 19일에 첫번째로 만들어진 이벤트
 */

/**
 * 이벤트 ID와 날짜로 짧은 코드 생성
 * 해당 날짜에 몇 번째로 만들어진 이벤트인지 계산
 * 예: 12월 19일 첫번째 이벤트 -> "121901"
 */
export async function generateShortCode(
  eventId: string, 
  eventDate: string,
  supabase: any
): Promise<string> {
  const date = new Date(eventDate)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const monthStr = String(month).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  const datePrefix = `${monthStr}${dayStr}` // 예: "1219"
  
  // 연도와 상관없이 해당 MMdd에 해당하는 모든 이벤트 찾기
  // 최신 연도부터 최근 10년까지 검색
  const currentYear = new Date().getFullYear()
  let allMatchingEvents: any[] = []
  
  // event_date 기준으로 검색 (이벤트가 열리는 날짜 기준)
  // 날짜 부분만 비교하기 위해 모든 이벤트를 가져온 후 필터링
  const { data: allEventsForDate, error: fetchError } = await supabase
    .from("events")
    .select("id, created_at, event_date")
    .order("created_at", { ascending: true })
  
  if (fetchError) {
    console.error(`Error fetching events:`, fetchError)
    return `${datePrefix}01` // 기본값: 첫번째
  }
  
  // 날짜 부분만 비교하여 필터링 (시간대 무시)
  if (allEventsForDate && allEventsForDate.length > 0) {
    allEventsForDate.forEach((event) => {
      const eventDate = new Date(event.event_date)
      const eventMonth = eventDate.getMonth() + 1
      const eventDay = eventDate.getDate()
      
      // MMdd가 일치하는 이벤트만 추가
      if (eventMonth === month && eventDay === day) {
        allMatchingEvents.push(event)
      }
    })
  }
  
  // 모든 연도에서 찾은 이벤트들을 created_at 순서로 정렬 (같은 날짜의 이벤트 순서 결정)
  allMatchingEvents.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateA - dateB
  })
  
  if (allMatchingEvents.length === 0) {
    return `${datePrefix}01` // 기본값: 첫번째
  }
  
  // 현재 이벤트가 몇 번째인지 찾기
  const eventIndex = allMatchingEvents.findIndex(e => e.id === eventId)
  
  if (eventIndex >= 0) {
    // 이벤트를 찾은 경우: 인덱스 + 1 (1-based)
    const orderNumber = eventIndex + 1
    const orderSuffix = String(orderNumber).padStart(2, '0')
    return `${datePrefix}${orderSuffix}` // 예: "121901"
  } else {
    // 이벤트를 찾지 못한 경우: 마지막 순서 + 1
    // (이벤트가 방금 생성되어 아직 쿼리 결과에 포함되지 않았을 수 있음)
    const orderNumber = allMatchingEvents.length + 1
    const orderSuffix = String(orderNumber).padStart(2, '0')
    return `${datePrefix}${orderSuffix}` // 예: "121902"
  }
}

/**
 * 이벤트의 짧은 URL 생성
 * 예: /e/121901
 */
export async function getEventShortUrl(
  eventId: string, 
  eventDate: string,
  supabase: any
): Promise<string> {
  const shortCode = await generateShortCode(eventId, eventDate, supabase)
  return `/e/${shortCode}`
}

/**
 * 짧은 코드에서 날짜 접두사와 순서번호 추출
 */
export function parseShortCode(shortCode: string): { datePrefix: string; orderNumber: number } | null {
  if (shortCode.length < 6) return null
  
  const datePrefix = shortCode.substring(0, 4) // MMdd
  const orderSuffix = shortCode.substring(4, 6) // 순서번호 (01, 02, 03...)
  const orderNumber = parseInt(orderSuffix, 10)
  
  if (isNaN(orderNumber) || orderNumber < 1) return null
  
  return { datePrefix, orderNumber }
}

/**
 * 짧은 코드로 이벤트를 찾기 위한 쿼리 조건 생성
 * 날짜 접두사(MMdd)와 순서번호로 검색
 */
export function buildEventQueryFromShortCode(shortCode: string) {
  const parsed = parseShortCode(shortCode)
  if (!parsed) return null
  
  const { datePrefix, orderNumber } = parsed
  
  // MMdd 형식에서 월과 일 추출
  const month = parseInt(datePrefix.substring(0, 2), 10)
  const day = parseInt(datePrefix.substring(2, 4), 10)
  
  return {
    month,
    day,
    orderNumber, // 1-based index
  }
}

