"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/rich-text-editor";
import { createPost } from "@/lib/actions/posts";

type NewPostFormProps = {
  userId?: string; // Optional: 서버 액션에서 자동으로 가져옴
  boardCategoryId?: string;
  communityId?: string;
  slug?: string; // 게시판 slug (리다이렉트 경로 결정용)
}

export function NewPostForm({ userId, boardCategoryId, communityId, slug }: NewPostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "group">("group"); // 기본값: 그룹 공개
  
  // 공개 설정 옵션을 보여줄지 여부 결정
  // slug가 없거나(일반 글쓰기), 공개 게시판 리스트에 포함되면 옵션을 숨김 (자동 전체 공개)
  const isPublicBoard = !slug || 
                        slug === "insights" || 
                        slug === "free-board" || slug === "free" || 
                        slug === "announcement" || slug === "announcements" || 
                        slug === "event-requests";
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createPost({
        title,
        content,
        visibility: isPublicBoard ? "public" : visibility,
        boardCategoryId,
        communityId,
        category: slug, // slug를 category로 전달
      });

      // slug가 있으면 해당 게시판으로, 없으면 일반 게시글 목록으로 리다이렉트
      if (slug) {
        router.push(`/community/board/${slug}`);
      } else {
        router.push("/community/posts");
      }
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "게시글 작성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-slate-900">
          제목
        </Label>
        <Input
          id="title"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-medium text-slate-900">
          내용
        </Label>
        <RichTextEditor
          content={content}
          onChange={(html) => setContent(html)}
        />
      </div>

      {!isPublicBoard && (
      <div className="space-y-2">
        <Label>공개 설정</Label>
        <RadioGroup
          value={visibility}
          onValueChange={(value) => setVisibility(value as "public" | "group")}
          className="mt-2"
        >
          <div className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <span>🌍</span>
                <div>
                  <div className="font-medium text-slate-900">전체 공개</div>
                  <div className="text-xs text-slate-500">멤버 누구나 볼 수 있습니다.</div>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <div>
                  <div className="font-medium text-slate-900">그룹 공개</div>
                  <div className="text-xs text-slate-500">이 커뮤니티 멤버만 볼 수 있습니다.</div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 버튼 영역 수정: 우측 정렬 및 강조 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-12 px-6 text-base"
        >
          취소
        </Button>
        <Button 
          type="submit" 
          className="h-12 px-10 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all" 
          disabled={isLoading}
        >
          {isLoading ? "저장 중..." : "작성하기"}
        </Button>
      </div>
    </form>
  );
}
