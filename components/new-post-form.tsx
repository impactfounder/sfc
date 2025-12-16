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
import { ImagePlus, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

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
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const MAX_IMAGES = 5;

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

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > MAX_IMAGES) {
      setError(`최대 ${MAX_IMAGES}개의 이미지만 첨부할 수 있습니다.`);
      return;
    }

    // 이미지 파일만 허용
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      setError('이미지 파일만 첨부할 수 있습니다.');
      return;
    }

    setImages([...images, ...imageFiles]);

    // 미리보기 생성
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 제거 핸들러
  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

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
      // 1. 게시글 생성
      const postId = await createPost({
        title,
        content,
        visibility: isPublicBoard ? "public" : visibility,
        boardCategoryId,
        communityId,
        category: (isInsightBoard || isPartnerBoard) && selectedCategory ? selectedCategory : slug,
        categoryId: (isInsightBoard || isPartnerBoard) && selectedCategory ? selectedCategory : undefined,
      });

      // 2. 이미지 업로드 (Supabase Storage)
      if (images.length > 0 && postId) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${postId}/${Date.now()}_${i}.${fileExt}`;

          // Supabase Storage에 업로드
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('이미지 업로드 오류:', uploadError);
            continue;
          }

          // 공개 URL 가져오기
          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);

          // post_images 테이블에 저장
          await supabase
            .from('post_images')
            .insert({
              post_id: postId,
              image_url: publicUrl,
              sort_order: i,
            });
        }
      }

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
          <Combobox
            options={(isInsightBoard ? insightCategories : partnerCategories).map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder="카테고리를 선택해주세요"
            searchPlaceholder="카테고리 검색..."
            emptyText="카테고리가 없습니다."
          />
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

      {/* 이미지 첨부 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-900">
          이미지 첨부 (최대 {MAX_IMAGES}개)
        </Label>

        {/* 이미지 미리보기 */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`미리보기 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 파일 선택 버튼 */}
        {images.length < MAX_IMAGES && (
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="w-8 h-8 text-slate-400" />
              <span className="text-sm text-slate-600">이미지 추가 ({images.length}/{MAX_IMAGES})</span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        )}
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
