"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/rich-text-editor";
import { createPost } from "@/lib/actions/posts";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NewPostFormProps = {
  userId?: string; // Optional: 서버 액션에서 자동으로 가져옴
  boardCategoryId?: string;
  communityId?: string;
  slug?: string; // 게시판 slug (리다이렉트 경로 결정용)
  onSuccess?: () => void; // 성공 시 콜백 (모달 닫기 등)
}

export function NewPostForm({ userId, boardCategoryId, communityId, slug, onSuccess }: NewPostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "group">("group"); // 기본값: 그룹 공개
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [insightCategories, setInsightCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [partnerCategories, setPartnerCategories] = useState<Array<{ id: string; name: string }>>([]);
  
  // 공개 설정 옵션을 보여줄지 여부 결정
  // slug가 없거나(일반 글쓰기), 공개 게시판 리스트에 포함되면 옵션을 숨김 (자동 전체 공개)
  const isPublicBoard = !slug || 
                        slug === "insights" || 
                        slug === "free-board" || slug === "free" || 
                        slug === "announcement" || slug === "announcements" || 
                        slug === "event-requests";
  
  const isInsightBoard = slug === "insights";
  const isPartnerBoard = slug === "partners";
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // 인사이트 카테고리 로드
  useEffect(() => {
    if (isInsightBoard) {
      const loadCategories = async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .eq("type", "insight")
          .order("created_at", { ascending: true });

        if (!error && data) {
          setInsightCategories(data);
        }
      };
      loadCategories();
    }
  }, [isInsightBoard, supabase]);

  // 파트너스 카테고리 로드
  useEffect(() => {
    if (isPartnerBoard) {
      const loadCategories = async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .eq("type", "partner")
          .order("created_at", { ascending: true });

        if (!error && data) {
          setPartnerCategories(data);
        }
      };
      loadCategories();
    }
  }, [isPartnerBoard, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 인사이트 게시판일 때 카테고리 필수 검증
    if (isInsightBoard && !selectedCategory) {
      setError("카테고리를 선택해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      await createPost({
        title,
        content,
        visibility: isPublicBoard ? "public" : visibility,
        boardCategoryId,
        communityId,
        category: (isInsightBoard || isPartnerBoard) && selectedCategory ? selectedCategory : slug, // 인사이트/파트너스인 경우 선택된 카테고리 사용
        categoryId: (isInsightBoard || isPartnerBoard) && selectedCategory ? selectedCategory : undefined, // category_id로 저장
      });

      // 성공 콜백 실행 (모달 닫기 등)
      if (onSuccess) {
        onSuccess()
      }

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
      {/* 카테고리 선택 (인사이트/파트너스 게시판일 때만, 제목 위에 배치) */}
      {(isInsightBoard || isPartnerBoard) && (
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium text-slate-900">
            카테고리 {isInsightBoard && <span className="text-red-500">*</span>}
          </Label>
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
            required={isInsightBoard}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="카테고리를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {(isInsightBoard ? insightCategories : partnerCategories).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
          onClick={() => {
            if (onSuccess) {
              onSuccess() // 모달이 열려있으면 모달 닫기
            } else {
              router.back() // 일반 페이지면 뒤로 가기
            }
          }}
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
