import Link from "next/link"
import Image from "next/image"

/**
 * 인증 페이지(로그인, 회원가입, 에러)용 공통 헤더
 */
export function AuthHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 lg:px-[27px]">
        <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
          <Image
            src="/images/logo-text.png"
            alt="Seoul Founders Club"
            width={120}
            height={24}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
      </div>
    </header>
  )
}
