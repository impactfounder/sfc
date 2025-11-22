// 디버깅용 페이지: 서버에서 실제로 데이터를 가져올 수 있는지 확인
// 배포 사이트에서 /debug 접속하여 확인

import { createClient } from "@/lib/supabase/server"

export default async function DebugPage() {
  const supabase = await createClient()

  // 환경 변수 확인
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const urlPreview = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) || "NOT SET"
  const keyPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) || "NOT SET"
  const keyLength = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0

  // 테스트 쿼리들
  const testQueries = {
    categories: await supabase
      .from("board_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .limit(5),
    
    events: await supabase
      .from("events")
      .select("id, title, event_date")
      .gte("event_date", new Date().toISOString())
      .limit(5),
    
    posts: await supabase
      .from("posts")
      .select("id, title, board_category_id")
      .limit(5),
    
    postsWithJoin: await supabase
      .from("posts")
      .select(`id, title, board_categories!inner(name, slug)`)
      .in("board_categories.slug", ["free", "vangol", "hightalk"])
      .limit(5),
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">디버깅 정보</h1>
      
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">환경 변수</h2>
          <div className="space-y-2">
            <p>Supabase URL: {hasUrl ? `✅ ${urlPreview}...` : "❌ NOT SET"}</p>
            <p>Anon Key: {hasKey ? `✅ SET (길이: ${keyLength}자, 미리보기: ${keyPreview}...)` : "❌ NOT SET"}</p>
            {hasKey && keyLength < 100 && (
              <p className="text-red-600 text-sm">⚠️ API 키가 너무 짧습니다. 올바른 anon public 키인지 확인하세요.</p>
            )}
            {hasKey && keyLength > 100 && keyLength < 200 && (
              <p className="text-yellow-600 text-sm">⚠️ API 키 길이가 정상 범위가 아닙니다. anon public 키 전체를 복사했는지 확인하세요.</p>
            )}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">카테고리 쿼리</h2>
          {testQueries.categories.error ? (
            <div className="text-red-600">
              <p className="font-semibold">❌ 에러: {testQueries.categories.error.message}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">상세 정보</summary>
                <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(testQueries.categories.error, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-green-600">✅ 성공: {testQueries.categories.data?.length || 0}개 결과</p>
              <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-40">{JSON.stringify(testQueries.categories.data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">이벤트 쿼리 (조인 없음)</h2>
          {testQueries.events.error ? (
            <div className="text-red-600">
              <p className="font-semibold">❌ 에러: {testQueries.events.error.message}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">상세 정보</summary>
                <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(testQueries.events.error, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-green-600">✅ 성공: {testQueries.events.data?.length || 0}개 결과</p>
              <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-40">{JSON.stringify(testQueries.events.data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">게시글 쿼리 (조인 없음)</h2>
          {testQueries.posts.error ? (
            <div className="text-red-600">
              <p className="font-semibold">❌ 에러: {testQueries.posts.error.message}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">상세 정보</summary>
                <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(testQueries.posts.error, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-green-600">✅ 성공: {testQueries.posts.data?.length || 0}개 결과</p>
              <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-40">{JSON.stringify(testQueries.posts.data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">게시글 쿼리 (Inner Join 포함) ⚠️</h2>
          {testQueries.postsWithJoin.error ? (
            <div className="text-red-600">
              <p className="font-semibold">❌ 에러: {testQueries.postsWithJoin.error.message}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">상세 정보</summary>
                <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(testQueries.postsWithJoin.error, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-green-600">✅ 성공: {testQueries.postsWithJoin.data?.length || 0}개 결과</p>
              {testQueries.postsWithJoin.data?.length === 0 && (
                <p className="text-yellow-600 text-sm mt-2">⚠️ 데이터가 비어있습니다. RLS 정책을 확인하세요.</p>
              )}
              <pre className="text-xs mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-40">{JSON.stringify(testQueries.postsWithJoin.data, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

