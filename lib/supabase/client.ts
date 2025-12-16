import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  // 브라우저 환경에서만 싱글톤 사용
  if (typeof window !== 'undefined' && supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인하세요.");
    throw new Error("Supabase 환경 변수 미설정");
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  // 브라우저 환경에서만 캐싱
  if (typeof window !== 'undefined') {
    supabaseInstance = client;
  }

  return client;
}
