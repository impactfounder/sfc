import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"

export default function MemberLoading() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      {/* [LEFT] 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        {/* PageHeader 적용 */}
        <PageHeader 
          title="멤버"
          description="각자의 영역에서 성과를 증명한, 검증된 멤버들을 만나보세요."
        />

        {/* 멤버 리스트 스켈레톤 */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          
          {/* MemberListClient와 동일한 그리드 구조 적용 (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <Card key={i} className="border-slate-200 bg-white h-full">
                <CardContent className="py-3 px-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center h-full">
                  {/* [Left] 프로필 이미지 & 이름 스켈레톤 */}
                  <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0 w-full sm:w-20">
                    <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  
                  {/* [Right] 정보 영역 스켈레톤 */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2 w-full">
                    {/* 소속 & 역할 */}
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex gap-1 mt-0.5">
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </div>

                    {/* 소개글 */}
                    <div className="space-y-1 mt-0.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>

                    {/* 뱃지 */}
                    <div className="mt-auto pt-1.5 flex gap-1">
                      <Skeleton className="h-6 w-20 rounded" />
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
