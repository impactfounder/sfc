import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function CommunitiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 소모임 목록 가져오기
  const { data: communities } = await supabase
    .from("communities")
    .select(`
      id,
      name,
      description,
      thumbnail_url,
      created_at,
      created_by,
      profiles:created_by (
        full_name
      ),
      community_members(count)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">커뮤니티</h1>
            <p className="mt-2 text-slate-600">관심사가 같은 멤버들과 함께하는 커뮤니티를 찾아보세요</p>
          </div>
          {user ? (
            <Link href="/communities/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                커뮤니티 만들기
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                로그인하고 만들기
              </Button>
            </Link>
          )}
        </div>

        {/* 커뮤니티 리스트 */}
        {communities && communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community: any) => (
              <Link key={community.id} href={`/communities/${community.id}`}>
                <Card className="border-slate-200 hover:shadow-md transition-shadow h-full">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg bg-slate-100">
                    {community.thumbnail_url ? (
                      <Image
                        src={community.thumbnail_url}
                        alt={community.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Users className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-1">
                      {community.name}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {community.description || "설명이 없습니다."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{community.community_members?.[0]?.count || 0}명</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(community.created_at).toLocaleDateString("ko-KR")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900">아직 커뮤니티가 없습니다</h3>
              <p className="mb-4 text-sm text-slate-600">첫 번째 커뮤니티를 만들어보세요</p>
              {user ? (
                <Link href="/communities/new">
                  <Button>커뮤니티 만들기</Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline">로그인하고 만들기</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

