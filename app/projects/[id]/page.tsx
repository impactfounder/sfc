import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, User, Calendar, Settings, ExternalLink } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name
      )
    `)
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const { data: members } = await supabase
    .from("project_members")
    .select(`
      id,
      role,
      profiles:user_id (
        id,
        full_name
      )
    `)
    .eq("project_id", id);

  const { data: techStack } = await supabase
    .from("project_tech_stack")
    .select("technology")
    .eq("project_id", id);

  const isCreator = user && project.created_by === user.id;
  const isMember = user && members?.some((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return profile?.id === user.id
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">← 목록으로</Button>
          </Link>
          {isCreator && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              프로젝트 관리
            </Button>
          )}
        </div>

        <Card className="border-slate-200">
          {project.thumbnail_url && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <img
                src={project.thumbnail_url || "/placeholder.svg"}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {project.category}
                  </Badge>
                  <Badge className={
                    project.status === 'recruiting' ? 'bg-green-500' :
                    project.status === 'active' ? 'bg-blue-500' :
                    'bg-slate-500'
                  }>
                    {project.status === 'recruiting' ? '모집중' :
                     project.status === 'active' ? '진행중' : '완료'}
                  </Badge>
                  {project.looking_for_members && (
                    <Badge className="bg-orange-500">
                      팀원 모집 중
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="mb-4 text-2xl md:text-3xl">{project.title}</CardTitle>
                
                <div className="space-y-2 md:space-y-3 text-sm md:text-base text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>프로젝트 리더: {project.profiles?.full_name || "익명"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>
                      시작일: {new Date(project.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  {project.github_url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      <a 
                        href={project.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        GitHub 저장소
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="mb-6">
              <h2 className="mb-3 text-lg md:text-xl font-semibold text-slate-900">
                프로젝트 소개
              </h2>
              <p className="whitespace-pre-wrap text-sm md:text-base text-slate-700 leading-relaxed">
                {project.description}
              </p>
            </div>

            {techStack && techStack.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-lg md:text-xl font-semibold text-slate-900">
                  기술 스택
                </h2>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-xs md:text-sm">
                      {tech.technology}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {project.looking_for_members && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 md:p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2 text-sm md:text-base">팀원을 찾고 있습니다!</h3>
                <p className="text-green-700 text-xs md:text-sm">
                  이 프로젝트는 현재 함께할 팀원을 모집 중입니다. 관심이 있다면 프로젝트 리더에게 연락해보세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {members && members.length > 0 && (
          <Card className="mt-8 border-slate-200">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">팀원 ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {members.map((member) => {
                  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
                  const name = profile?.full_name || "익명";
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                        {name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">{member.role || '팀원'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
