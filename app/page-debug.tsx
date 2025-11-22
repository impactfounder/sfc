// 디버깅용: 이 파일은 실제 사용하지 않음
// app/page.tsx에서 사용할 수 있는 디버깅 코드 예시

// Server Component에서 디버깅 로그 출력
// Next.js Server Component에서는 console.log가 서버 로그(Vercel Functions 로그)에 출력됨

// 사용 예시:
export default async function HomePage() {
  const supabase = await createClient()

  console.log("=== HomePage Debug ===")
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...")
  console.log("Has ANON KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // 이벤트 쿼리
  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select(`*`)
    .gte("event_date", new Date().toISOString())
    .limit(9)

  console.log("Events query result:", {
    hasData: !!eventsData,
    dataLength: eventsData?.length || 0,
    error: eventsError?.message || null
  })

  // ... 나머지 코드
}

