import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Heart, Plus } from "lucide-react"
import Link from "next/link"

export default async function PostsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch posts with author information
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("category", "discussion")
    .order("created_at", { ascending: false })

  return (
    <div className="p-4 md:p-8 overflow-x-hidden max-w-full w-full">
      <div className="mx-auto max-w-4xl overflow-x-hidden">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">자유게시판</h1>
            <p className="mt-2 text-slate-600">자유롭게 의견을 나누고 소통하세요</p>
          </div>
          {user ? (
            <Link href="/community/posts/new">
              <Button className="gap-2 transition-all active:scale-[0.98] hover:shadow-lg">
                <Plus className="h-4 w-4" />
                글쓰기
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button className="gap-2 transition-all active:scale-[0.98] hover:shadow-lg">
                <Plus className="h-4 w-4" />
                로그인하고 글쓰기
              </Button>
            </Link>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Link key={post.id} href={`/community/posts/${post.id}`}>
                <Card className="border-slate-200 transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                        {post.profiles?.full_name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{post.profiles?.full_name || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                    <CardTitle className="mt-4">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-slate-600">{post.content}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">아직 게시글이 없습니다</h3>
                <p className="mb-4 text-sm text-slate-600">첫 번째 게시글을 작성해보세요</p>
                {user ? (
                  <Link href="/community/posts/new">
                    <Button className="transition-all active:scale-[0.98] hover:shadow-lg">글쓰기</Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button className="transition-all active:scale-[0.98] hover:shadow-lg">로그인하고 글쓰기</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
