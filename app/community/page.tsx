import { createClient } from "@/lib/supabase/server";
import { Calendar, Users, Rocket, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function CommunityDashboardPage() {
  const supabase = await createClient();
  
  const { data: recentPosts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (full_name, avatar_url),
      board_categories (name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select(`
      *,
      profiles:created_by (full_name),
      event_registrations (count)
    `)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(4);

  const { data: recentProjects } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:created_by (full_name, avatar_url),
      project_members (count)
    `)
    .eq("looking_for_members", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: activeMembers } = await supabase
    .from("profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(8);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Community
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            질문하고, 나누고, 연결되는 공간입니다.
            <br className="hidden md:block" />
            창업, 투자, 커리어, 크리에이티브에 대한 모든 이야기를 환영합니다.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-blue-100 p-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">총 게시물</p>
                <p className="text-2xl font-bold text-slate-900">{recentPosts?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-100 p-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">진행 예정 이벤트</p>
                <p className="text-2xl font-bold text-slate-900">{upcomingEvents?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-purple-100 p-3">
                <Rocket className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">활성 프로젝트</p>
                <p className="text-2xl font-bold text-slate-900">{recentProjects?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-orange-100 p-3">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">활동 멤버</p>
                <p className="text-2xl font-bold text-slate-900">{activeMembers?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Recent Posts & Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Posts */}
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    최신 게시물
                  </CardTitle>
                  <Link href="/community/posts">
                    <Button variant="ghost" size="sm">
                      전체보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts && recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/board/${post.board_categories?.slug}/${post.id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {post.profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-900">
                              {post.profiles?.full_name || 'Unknown'}
                            </p>
                            {post.board_categories && (
                              <Badge variant="outline" className="text-xs">
                                {post.board_categories.name}
                              </Badge>
                            )}
                          </div>
                          <h3 className="mb-1 font-semibold text-slate-900 line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(post.created_at).toLocaleDateString('ko-KR')}
                            </span>
                            <span>{post.comments_count || 0} 댓글</span>
                            <span>{post.likes_count || 0} 좋아요</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-500">아직 게시물이 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    다가오는 이벤트
                  </CardTitle>
                  <Link href="/community/events">
                    <Button variant="ghost" size="sm">
                      전체보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingEvents && upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => {
                      const registrationCount = event.event_registrations?.[0]?.count || 0;
                      const eventDate = new Date(event.event_date);
                      
                      return (
                        <Link
                          key={event.id}
                          href={`/community/events/${event.id}`}
                          className="block"
                        >
                          <div className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-md">
                            <h3 className="mb-2 font-semibold text-slate-900 line-clamp-2">
                              {event.title}
                            </h3>
                            <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                              {event.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>
                                {eventDate.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {registrationCount}
                                {event.max_participants && ` / ${event.max_participants}`}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="col-span-2 py-8 text-center text-slate-500">
                      예정된 이벤트가 없습니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Active Projects & Members */}
          <div className="space-y-8">
            {/* Active Projects */}
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    팀원 모집 중
                  </CardTitle>
                  <Link href="/projects">
                    <Button variant="ghost" size="sm">
                      전체보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentProjects && recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900 line-clamp-1 text-sm">
                            {project.title}
                          </h4>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {project.category}
                          </Badge>
                        </div>
                        <p className="mb-2 text-xs text-slate-600 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={project.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {project.profiles?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-600">
                            {project.profiles?.full_name}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-slate-500">
                    모집 중인 프로젝트가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Members */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  활동 중인 멤버
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {activeMembers && activeMembers.length > 0 ? (
                    activeMembers.map((member) => (
                      <div key={member.id} className="flex flex-col items-center gap-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-center text-slate-900 line-clamp-1 w-full">
                          {member.full_name || 'Unknown'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-4 py-8 text-center text-sm text-slate-500">
                      활동 중인 멤버가 없습니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
