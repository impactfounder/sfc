import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"

export default function MemberLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="멤버"
        description="각자의 영역에서 성과를 증명한, 검증된 멤버들을 만나보세요."
        compact={true}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* 필터 버튼 스켈레톤 */}
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>

        {/* 실제 레이아웃과 동일한 3열 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-slate-200 bg-white h-full overflow-hidden flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {/* 상단 영역 */}
                <div className="pt-3 px-4 pb-2 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3 ml-2">
                    {/* 아바타 */}
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      {/* 이름 */}
                      <Skeleton className="h-5 w-24" />
                      {/* 소속/직책 */}
                      <Skeleton className="h-4 w-40" />
                      {/* 역할 태그 */}
                      <div className="flex gap-1">
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="h-4 w-14 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* 소개글 영역 */}
                  <div className="w-full mt-1 h-9 flex items-center justify-center px-1">
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>

                {/* 하단 배지 영역 */}
                <div className="w-full h-[72px] shrink-0 flex items-center justify-between gap-1 px-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex-1 basis-1/3 min-w-0 flex flex-col items-center justify-center gap-1">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}