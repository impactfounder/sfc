import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default function AboutLoading() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* [LEFT] 콘텐츠 영역 */}
      <div className="lg:col-span-9 flex flex-col gap-6">

        {/* Hero Section 스켈레톤 (AboutContent와 정확히 동일하게) */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md mb-10">
          <div className="relative z-10 px-4 py-8 md:py-10 flex flex-col items-center text-center max-w-6xl mx-auto">
            <Skeleton className="h-5 w-40 mb-3 rounded-full bg-slate-800" />
            <Skeleton className="h-10 md:h-12 w-3/4 max-w-2xl mb-3 bg-slate-800" />
            <div className="space-y-2 w-full max-w-2xl flex flex-col items-center mb-5">
              <Skeleton className="h-3 md:h-4 w-full bg-slate-800" />
              <Skeleton className="h-3 md:h-4 w-5/6 bg-slate-800" />
            </div>
            <Skeleton className="h-10 w-36 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* 본문 섹션 스켈레톤 */}
        <div className="py-16 px-6 bg-white rounded-xl shadow-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Skeleton className="h-9 w-80 mx-auto mb-4" />
              <Skeleton className="h-6 w-64 mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <Skeleton className="h-20 w-20 rounded-2xl mb-6" />
                  <Skeleton className="h-7 w-40 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 추가 섹션 스켈레톤 */}
        <div className="py-20 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-64" />
              </div>
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border-none rounded-xl shadow-sm p-8 space-y-3 h-full">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 뱃지 시스템 섹션 스켈레톤 */}
        <div className="py-20 px-6 bg-white rounded-xl shadow-sm">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-9 w-80 mx-auto mb-8" />
            <Skeleton className="h-5 w-96 mx-auto mb-10" />
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA 섹션 스켈레톤 */}
        <div className="py-24 px-6 bg-white text-center">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-10 w-64 mx-auto mb-6" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-5/6 mx-auto mb-10" />
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Skeleton className="h-14 w-48 rounded-full" />
              <Skeleton className="h-14 w-56 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* [RIGHT] 사이드바 영역 */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}
