"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createPost } from "@/lib/actions/posts"

type NewBoardPostFormProps = {
  slug: string
  boardCategoryId: string
}

export function NewBoardPostForm({ slug, boardCategoryId }: NewBoardPostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "group">("group")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await createPost({
        title,
        content,
        visibility,
        boardCategoryId,
        category: slug,
      })

      router.push(`/community/board/${slug}`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "게시글 작성에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-slate-900">
          제목
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="제목을 입력하세요"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-slate-900">
          내용
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="내용을 입력하세요"
          className="min-h-[300px] w-full"
        />
      </div>

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
                  <div className="text-xs text-slate-500">SFC 멤버 누구나 볼 수 있습니다.</div>
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
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "작성 중..." : "작성하기"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </div>
    </form>
  )
}

