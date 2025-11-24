import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import EventCard from "@/components/ui/event-card"
import { AnnouncementBanner } from "@/components/home/announcement-banner"
import { EventsSectionHeader } from "./_components/events-section-header"
import { PostsSection } from "@/components/home/posts-section"
import { getLatestAnnouncement } from "@/lib/queries/announcements"
import { getUpcomingEvents } from "@/lib/queries/events"
import { getLatestPosts } from "@/lib/queries/posts"
import { getBoardCategories } from "@/lib/queries/board-categories"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // 현재 사용자 정보 가져오기 (멤버십 체크용)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch data using query helpers
  const [announcement, eventsForDisplay, transformedPosts, boardCategories] = await Promise.all([
    getLatestAnnouncement(supabase),
    getUpcomingEvents(supabase, 9),
    getLatestPosts(supabase, 50),
    getBoardCategories(supabase),
  ])

  // 각 게시글의 커뮤니티 멤버십 확인 (나중에 최적화 가능)
  const postsWithMembership = await Promise.all(
    transformedPosts.map(async (post: any) => {
      // community_id가 있고 visibility가 'group'인 경우에만 체크
      if (post.communities && post.visibility === "group" && user) {
        // TODO: 실제 community_id를 가져와서 멤버십 체크
        // 임시로 true로 설정 (나중에 로직 추가)
        return { ...post, isMember: true }
      }
      // public이거나 로그인하지 않은 경우는 항상 true (public은 모두 볼 수 있음)
      return { ...post, isMember: true }
    })
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="space-y-8">
          {/* Announcement Banner */}
          {announcement && (
            <AnnouncementBanner announcement={announcement} />
          )}

          {/* Events Section */}
          <Card>
            <EventsSectionHeader />
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {eventsForDisplay.length > 0 ? (
                  eventsForDisplay.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      layout="poster"
                      href={`/events/${event.id}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    예정된 이벤트가 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Latest Posts Section */}
          <Card>
            <CardContent className="pt-6">
              <PostsSection
                posts={postsWithMembership}
                boardCategories={boardCategories || []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
