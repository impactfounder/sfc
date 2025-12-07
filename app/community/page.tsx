import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { CommunityIntro } from "@/components/community-intro"
import { getCommunityFeed } from "@/lib/queries/feed"
import { PostCard } from "@/components/ui/post-card"
import { EventPostCard } from "@/components/event-post-card"
import { cn } from "@/lib/utils"

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function CommunityDashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const sort = searchParams?.sort === "popular" ? "popular" : "latest"

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: setting } = await supabase
    .from("community_settings")
    .select("value")
    .eq("key", "community_intro")
    .single()

  const communityIntro = setting?.value || "다양한 주제로 소통하고 함께 성장하는 공간입니다."

  // 통합 피드
  const feed = await getCommunityFeed(supabase, sort)

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      <main className="lg:col-span-9 flex flex-col gap-6">
        <CommunityIntro initialIntro={communityIntro} canEdit={false} />

        {/* 정렬 탭 */}
        <div className="flex items-center gap-3">
          <SortTab href="/community" active={sort === "latest"}>
            최신순
          </SortTab>
          <SortTab href="/community?sort=popular" active={sort === "popular"}>
            인기순
          </SortTab>
        </div>

        {/* 피드 리스트 */}
        <div className="space-y-4">
          {feed.map((item) =>
            item.kind === "event" ? (
              <EventPostCard key={`event-${item.id}`} event={item} />
            ) : (
              <PostCard
                key={`post-${item.id}`}
                postId={item.id}
                href={`/community/board/${item.board_categories?.slug ?? "community"}/${item.id}`}
                community={{
                  name: item.board_categories?.name ?? "커뮤니티",
                  href: `/community/board/${item.board_categories?.slug ?? "community"}`,
                  iconUrl: item.thumbnail_url ?? undefined,
                }}
                author={{ name: item.profiles?.full_name ?? "익명" }}
                createdAt={item.created_at}
                title={item.title}
                content={item.content_preview ?? undefined}
                contentRaw={(item as any).content ?? undefined}
                thumbnailUrl={item.thumbnail_url ?? undefined}
                likesCount={item.likes_count ?? 0}
                commentsCount={item.comments_count ?? 0}
                userId={user?.id}
                initialLiked={false}
              />
            )
          )}
        </div>
      </main>

      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </aside>
    </div>
  )
}

function SortTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
        active ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-300"
      )}
    >
      {children}
    </Link>
  )
}
