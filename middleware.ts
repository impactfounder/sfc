import { type NextRequest, NextResponse } from "next/server"

// 인증은 각 페이지의 Server Component에서 직접 처리합니다
export async function middleware(request: NextRequest) {
  // 단순히 요청을 통과시킵니다
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
