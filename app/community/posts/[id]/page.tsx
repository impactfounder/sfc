import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Heart, MessageSquare } from "lucide-react"
import { LikeButton } from "@/components/like-button"
import { CommentSection } from "@/components/comment-section"
import { PostActions } from "@/components/post-actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isMasterAdmin } from "@/lib/utils"
import { UserBadges } from "@/components/user-badges"

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 병렬로 데이터 가져오기
  const [userResult, postResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single()
  ])

  const { data: { user } } = userResult
  const { data: post } = postResult

  if (!post) {
    notFound()
  }

  // 병렬로 나머지 데이터 가져오기
  const [userLikeResult, commentsResult, profileResult, badgesResult] = await Promise.all([
    user ? supabase.from("post_likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    user ? supabase.from("profiles").select("role, email").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    post.author_id ? supabase
      .from("user_badges")
      .select(`
        badges:badge_id (
          icon,
          name
        )
      `)
      .eq("user_id", post.author_id)
      .eq("is_visible", true) : Promise.resolve({ data: null })
  ])

  const userLike = userLikeResult.data
  const { data: comments } = commentsResult
  const { data: profile } = profileResult

  // Check if user is author
  const isAuthor = Boolean(user && post.author_id === user.id)

  // Check if user is master admin
  const isMaster = profile ? isMasterAdmin(profile.role, profile.email) : false

  // 작성자의 노출된 뱃지 가져오기
  let authorVisibleBadges: Array<{ icon: string; name: string }> = []
  if (badgesResult.data) {
    authorVisibleBadges = badgesResult.data
      .map((ub: any) => ub.badges)
      .filter(Boolean)
      .map((badge: any) => ({
        icon: badge.icon,
        name: badge.name,
      }))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Post */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-700">
                {post.profiles?.full_name?.[0] || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900">{post.profiles?.full_name || "Anonymous"}</p>
                  {authorVisibleBadges.length > 0 && (
                    <UserBadges badges={authorVisibleBadges} />
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(post.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {(isAuthor || isMaster) && (
              <PostActions postId={post.id} isAuthor={isAuthor} isMaster={isMaster} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">{post.title}</h1>
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{post.content}</p>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-4 border-t border-slate-200 pt-4">
            {user ? (
              <LikeButton
                postId={post.id}
                userId={user.id}
                initialLiked={userLike !== null}
                initialCount={post.likes_count || 0}
              />
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes_count}</span>
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments_count} comments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommentSection postId={post.id} userId={user?.id} comments={comments || []} />
    </div>
  )
}
