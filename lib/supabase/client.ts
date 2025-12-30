import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인하세요.");
    throw new Error("Supabase 환경 변수 미설정");
  }

  // 싱글톤 제거 - OAuth 콜백 후 쿠키 변경을 감지하기 위해 매번 새 클라이언트 생성
  // createBrowserClient는 내부적으로 쿠키를 읽어 세션을 복원함
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
