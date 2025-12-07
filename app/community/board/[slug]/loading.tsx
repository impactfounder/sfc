import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "@/components/page-header"

export default function BoardLoading() {
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        {/* 배너 스켈레톤 - PageHeader와 동일한 크기 */}
        <PageHeaderSkeleton compact={true} className="mb-0" />

        {/* 뷰 모드 토글 + 버튼 영역 */}
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>

        {/* 게시글 리스트 스켈레톤 */}
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
