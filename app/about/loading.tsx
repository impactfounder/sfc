import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default function AboutLoading() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      {/* [LEFT] 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        
        {/* Hero Section 스켈레톤 (AboutContent와 높이/모양 일치) */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm mb-10 h-[300px] md:h-[360px]">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
             <Skeleton className="h-6 w-32 mb-4 rounded-full bg-slate-800" />
             <Skeleton className="h-10 w-3/4 max-w-lg mb-4 bg-slate-800" />
             <div className="space-y-2 w-full max-w-md flex flex-col items-center">
               <Skeleton className="h-4 w-full bg-slate-800" />
               <Skeleton className="h-4 w-5/6 bg-slate-800" />
             </div>
             <Skeleton className="h-10 w-40 mt-8 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* 본문 섹션 스켈레톤 */}
        <div className="py-16 px-6 bg-white border-b border-slate-100 rounded-2xl">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-10 w-96 mx-auto" />
              <Skeleton className="h-6 w-64 mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-4">
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 추가 섹션 스켈레톤 */}
        <div className="py-20 px-6 bg-slate-50 space-y-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-3/4" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 bg-white rounded-lg space-y-4 h-full">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* [RIGHT] 사이드바 영역 */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}
