import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// 싱글톤 인스턴스
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수 미설정");
  }

  // 브라우저 환경에서는 싱글톤 인스턴스 재사용
  if (typeof window !== 'undefined') {
    if (!supabaseInstance) {
      supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
  }

  // 서버 환경에서는 매번 새로 생성
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// 로그아웃 시 인스턴스 초기화용
export function resetClient() {
  supabaseInstance = null;
}
