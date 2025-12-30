import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let lastAuthState: boolean | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수 미설정");
  }

  if (typeof window !== 'undefined') {
    // 인증 쿠키 유무만 체크 (다른 쿠키 변경에 영향 안 받음)
    const hasAuthCookie = document.cookie.includes('sb-');

    if (supabaseInstance && lastAuthState === hasAuthCookie) {
      return supabaseInstance;
    }

    lastAuthState = hasAuthCookie;
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
