import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* [LEFT] 메인 콘텐츠 */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* 헤더 (뒤로가기) */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* 게시글 카드 */}
          <Card className="border border-slate-200 rounded-xl shadow-sm bg-white">
            <CardContent className="p-6 md:p-8">
              {/* 게시판 태그 */}
              <Skeleton className="h-6 w-20 mb-4 rounded-md" />

              {/* 작성자 정보 */}
              <div className="mb-6 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>

              {/* 제목 */}
              <Skeleton className="h-8 w-3/4 mb-8" />

              {/* 본문 */}
              <div className="space-y-3 mb-10">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* 하단 액션 */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>

              {/* 댓글 섹션 */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <Skeleton className="h-6 w-20 mb-6" />
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* [RIGHT] 우측 사이드바 영역 */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>

      </div>
    </div>
  );
}
