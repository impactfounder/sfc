'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Loader2, FolderKanban, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  '웹 개발',
  '모바일 앱',
  'AI/ML',
  '블록체인',
  '게임',
  'IoT',
  '데이터 분석',
  '기타',
];

export function NewProjectForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter(t => t !== tech));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const lookingForMembers = formData.get('lookingForMembers') === 'on';

    const supabase = createClient();

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          category,
          status: lookingForMembers ? 'recruiting' : 'active',
          looking_for_members: lookingForMembers,
          thumbnail_url: thumbnailUrl || null,
          github_url: githubUrl || null,
          created_by: userId,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add creator as project member
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: userId,
          role: '프로젝트 리더',
        });

      if (memberError) throw memberError;

      // Add tech stack
      if (techStack.length > 0) {
        const techStackData = techStack.map(tech => ({
          project_id: project.id,
          technology: tech,
        }));

        const { error: techError } = await supabase
          .from('project_tech_stack')
          .insert(techStackData);

        if (techError) throw techError;
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Thumbnail Preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <Label className="text-base font-semibold mb-3 block">프로젝트 썸네일</Label>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl || "/placeholder.svg"}
                alt="Thumbnail preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <FolderKanban className="h-24 w-24 text-white opacity-80" />
            )}
          </div>
          <div className="mt-4">
            <Label htmlFor="thumbnailUrl" className="text-sm">썸네일 이미지 URL</Label>
            <Input
              id="thumbnailUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-slate-500">
              프로젝트를 대표하는 이미지 URL을 입력하세요
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form Fields */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <Label htmlFor="title" className="text-base font-semibold">
            프로젝트 이름 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="예: AI 기반 챗봇 서비스"
            className="mt-2 text-lg"
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-base font-semibold">
            카테고리 <span className="text-red-500">*</span>
          </Label>
          <Select name="category" required>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="카테고리를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-semibold">
            프로젝트 설명 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={12}
            placeholder="프로젝트에 대한 자세한 설명을 작성하세요..."
            className="mt-2 resize-none"
          />
          <p className="mt-2 text-sm text-slate-500">
            프로젝트 목적, 주요 기능, 기대 효과 등을 자유롭게 작성하세요
          </p>
        </div>

        <div>
          <Label htmlFor="githubUrl" className="text-base font-semibold">
            GitHub 저장소
          </Label>
          <Input
            id="githubUrl"
            type="url"
            placeholder="https://github.com/username/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-base font-semibold">기술 스택</Label>
          <div className="mt-2 flex gap-2">
            <Input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTech();
                }
              }}
              placeholder="예: React, Node.js, PostgreSQL"
            />
            <Button type="button" onClick={addTech} variant="outline">
              추가
            </Button>
          </div>
          {techStack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="gap-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="lookingForMembers"
            name="lookingForMembers"
            className="h-4 w-4 rounded border-slate-300"
          />
          <Label htmlFor="lookingForMembers" className="text-sm font-normal cursor-pointer">
            팀원을 모집하고 있습니다
          </Label>
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                프로젝트 생성 중...
              </>
            ) : (
              '프로젝트 만들기'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-12 px-8"
          >
            취소
          </Button>
        </div>
      </div>
    </form>
  );
}
