import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, Plus, Search } from 'lucide-react';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: activeProjects } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name
      ),
      project_members(count)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: completedProjects } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name
      ),
      project_members(count)
    `)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              프로젝트
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-600">
              협업할 프로젝트를 찾거나 새로운 프로젝트를 시작하세요
            </p>
          </div>
          {user ? (
            <Link href="/projects/new" className="w-full md:w-auto">
              <Button className="w-full md:w-auto gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base">
                <Plus className="h-5 w-5" />
                프로젝트 만들기
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login" className="w-full md:w-auto">
              <Button className="w-full md:w-auto gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base">
                <Plus className="h-5 w-5" />
                로그인하고 프로젝트 만들기
              </Button>
            </Link>
          )}
        </div>

        {/* Active Projects */}
        <div className="mb-12">
          <h2 className="mb-4 text-lg md:text-xl font-semibold text-slate-900">
            진행 중인 프로젝트
          </h2>
          {activeProjects && activeProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {activeProjects.map((project) => {
                const memberCount = project.project_members?.[0]?.count || 0;
                const needsMembers = project.looking_for_members;
                
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="h-full overflow-hidden border-slate-200 transition-shadow hover:shadow-lg">
                      <div className="relative h-40 md:h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url || "/placeholder.svg"}
                            alt={project.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FolderKanban className="h-16 w-16 text-white opacity-80" />
                          </div>
                        )}
                        {needsMembers && (
                          <Badge className="absolute top-3 right-3 bg-green-500">
                            팀원 모집 중
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-3 md:p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {project.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.status === 'active' ? '진행중' : project.status === 'recruiting' ? '모집중' : '완료'}
                          </Badge>
                        </div>

                        <h3 className="mb-3 h-12 md:h-14 line-clamp-2 text-base md:text-lg font-semibold text-slate-900">
                          {project.title}
                        </h3>

                        <p className="mb-4 line-clamp-2 text-xs md:text-sm text-slate-600">
                          {project.description}
                        </p>

                        <div className="space-y-2 text-xs md:text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>팀원 {memberCount}명</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <FolderKanban className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  진행 중인 프로젝트가 없습니다
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  첫 번째 프로젝트를 만들어보세요
                </p>
                {user ? (
                  <Link href="/projects/new">
                    <Button>프로젝트 만들기</Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button>로그인하고 프로젝트 만들기</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Projects */}
        {completedProjects && completedProjects.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg md:text-xl font-semibold text-slate-900">
              완료된 프로젝트
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {completedProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="h-full border-slate-200 opacity-75 transition-all hover:opacity-100">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit text-xs mb-2">
                        {project.category}
                      </Badge>
                      <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {project.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
