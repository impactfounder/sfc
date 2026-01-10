"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { createPost } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Loader2 } from 'lucide-react';

export function NewAnnouncementForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createPost({
        title: formData.title,
        content: formData.content,
        category: "announcement",
      });

      router.push("/community/announcements");
      router.refresh();
    } catch (error) {
      console.error("Error creating announcement:", error);
      if (error instanceof Error && error.message === "Unauthorized") {
        router.push("/auth/login");
        return;
      }
      alert("공지사항 작성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              placeholder="공지사항 제목을 입력하세요"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) =>
                setFormData({ ...formData, content: html })
              }
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              공지사항 작성
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
