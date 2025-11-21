import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Heart, MessageSquare } from "lucide-react"
import { LikeButton } from "@/components/like-button"
import { CommentSection } from "@/components/comment-section"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PostActions } from "@/components/post-actions"

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch post with author information
  const { data: post } = await supabase
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

  if (!post) {
    notFound()
  }

  // Check if user has liked this post (only if logged in)
  let userLike = null
  if (user) {
    const { data } = await supabase.from("post_likes").select("id").eq("post_id", id).eq("user_id", user.id).single()
    userLike = data
  }

  // Fetch comments
  const { data: comments } = await supabase
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
    .order("created_at", { ascending: true })

  const isAuthor = user && post.author_id === user.id

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        {/* Post */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-700">
                  {post.profiles?.full_name?.[0] || "U"}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{post.profiles?.full_name || "Anonymous"}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(post.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {isAuthor && <PostActions postId={post.id} />}
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
                  initialLiked={!!userLike}
                  initialCount={post.likes_count}
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
        <div className="mt-8">
          <CommentSection postId={post.id} userId={user?.id} comments={comments || []} />
        </div>
      </div>
    </div>
  )
}
