import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"

export default function EventsLoading() {
  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* [LEFT] 메인 콘텐츠 */}
      <div className="xl:col-span-9 flex flex-col gap-6">
        {/* PageHeader 스켈레톤 */}
        <PageHeader 
          title="이벤트"
          description="함께 성장하는 네트워킹 파티와 인사이트 세미나를 놓치지 마세요."
          compact={true}
        >
          <Skeleton className="h-10 w-32" />
        </PageHeader>

        {/* 다가오는 이벤트 스켈레톤 */}
        <div className="w-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between w-full mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="hidden md:block h-10 w-32" />
          </div>

          {/* 필터 버튼 */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
            ))}
          </div>

          {/* 모바일 스켈레톤 */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2].map((i) => (
                <div key={i} className="w-[85%] flex-shrink-0 aspect-[4/5] rounded-[20px] overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>

          {/* 데스크탑 스켈레톤 */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full aspect-[4/5] rounded-[20px] overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* [RIGHT] 우측 사이드바 스켈레톤 (xl 이상에서만 표시) */}
      <div className="hidden xl:block xl:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

