import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"

export default function EventsLoading() {
  return (
    <div className="flex flex-col gap-10">
      {/* PageHeader 스켈레톤 */}
      <PageHeader 
        title="이벤트"
        description="함께 성장하는 네트워킹 파티와 인사이트 세미나를 놓치지 마세요."
      >
        <Skeleton className="h-10 w-32" />
      </PageHeader>

      {/* 다가오는 이벤트 스켈레톤 */}
      <div>
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-[24px]">
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

