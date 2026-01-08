"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ImageIcon, Upload, Search } from "lucide-react"
import { searchUnsplashImages } from "@/app/actions/unsplash"
import { createCommunity } from "@/lib/actions/community"

export function NewCommunityForm({ userId, onSuccess }: { userId?: string; onSuccess?: () => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [unsplashQuery, setUnsplashQuery] = useState("")
  const [unsplashResults, setUnsplashResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (!response.ok) throw new Error("업로드 실패")
      const data = await response.json()
      setThumbnailUrl(data.url)
    } catch (error) {
      alert("이미지 업로드 실패")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUnsplashSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unsplashQuery.trim()) return
    setIsSearching(true)
    try {
      const result = await searchUnsplashImages(unsplashQuery)
      if (result.success) setUnsplashResults(result.results || [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert("소모임 이름을 입력해주세요.")

    setIsLoading(true)
    setError(null)

    try {
      // Server Action으로 커뮤니티 생성
      const result = await createCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      if (onSuccess) {
        onSuccess()
      } else if (result.data) {
        router.push(`/communities/${result.data.id}`)
      }
      router.refresh()
    } catch (error: any) {
      setError(error.message || "소모임 생성에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* 1. 제목 입력 - 최상단 (전체 너비, Luma 스타일) */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="커뮤니티 이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-3xl sm:text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none bg-transparent focus:outline-none focus:ring-0 px-0 py-1"
          required
        />
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* 2. 이미지(좌) + 상세정보(우) 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* [Left] Image Upload Section (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-3">
                {isUploading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12" />
                    <span className="text-sm font-medium">클릭하여 이미지 업로드</span>
                    <span className="text-xs text-slate-400">또는 아래에서 Unsplash 검색</span>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Unsplash Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Unsplash 검색 (예: community)"
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnsplashSearch(e)}
                className="pl-9 h-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!unsplashQuery.trim()}
              onClick={handleUnsplashSearch}
              className="h-10 px-4"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
            </Button>
          </div>

          {unsplashResults.length > 0 && (
            <div className="grid grid-cols-4 gap-2 p-3 bg-white border border-slate-200 rounded-xl max-h-[180px] overflow-y-auto">
              {unsplashResults.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square relative cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
                  onClick={() => setThumbnailUrl(img.urls.regular)}
                >
                  <img src={img.urls.small} alt="Unsplash" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* [Right] Community Info Section (7 cols) - 카드 형태 */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-slate-700 mb-2 block">
                한줄 소개
              </Label>
              <Textarea
                id="description"
                placeholder="커뮤니티에 대한 간단한 소개를 입력하세요. 어떤 사람들이 모이는 곳인지, 어떤 활동을 하는지 알려주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[140px] resize-none border-slate-200 bg-slate-50 focus-visible:ring-slate-200"
                rows={6}
              />
              <p className="text-xs text-slate-400 mt-2">
                매력적인 소개글은 더 많은 멤버를 모읍니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto sm:min-w-[200px] sm:ml-auto sm:flex bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              처리 중...
            </>
          ) : (
            "커뮤니티 만들기"
          )}
        </Button>
      </div>
    </form>
  )
}

