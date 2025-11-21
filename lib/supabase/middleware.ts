import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // 쿠키에서 토큰 가져오기
  const accessToken = request.cookies.get("sb-access-token")?.value

  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    const pathname = request.nextUrl.pathname
    const protectedPaths = ["/admin"]
    const isProtectedPath = protectedPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))

    if (isProtectedPath && (!user || error)) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}
