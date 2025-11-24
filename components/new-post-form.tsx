"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createPost } from "@/lib/actions/posts";

export function NewPostForm({ userId, boardCategoryId, communityId }: { userId: string; boardCategoryId?: string; communityId?: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "group">("group"); // 기본값: 그룹 공개
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
        visibility,
        boardCategoryId,
        communityId,
      });

      router.push("/community/posts");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              className="mt-2"
            />
          </div>

          <div>
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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Post"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
