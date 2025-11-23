"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ImageIcon, Upload, Search, X } from "lucide-react"
import { searchUnsplashImages } from "@/app/actions/unsplash"

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!userId) {
      const fetchUser = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)
      }
      fetchUser()
    }
  }, [userId])

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
    if (!currentUserId) return alert("로그인이 필요합니다.")
    if (!name.trim()) return alert("소모임 이름을 입력해주세요.")

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // 1. 소모임 생성
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl || null,
          created_by: currentUserId,
          is_private: false,
        })
        .select()
        .single()

      if (communityError) throw communityError

      // 2. 생성자를 owner로 자동 등록
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: currentUserId,
          role: "owner",
        })

      if (memberError) throw memberError

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/communities/${community.id}`)
      }
      router.refresh()
    } catch (error: any) {
      setError(error.message || "소모임 생성에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Section: Image (Left) & Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* [Left] Image Upload Section (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div 
            className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-sm font-medium">이미지 업로드</span>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Unsplash Search */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Unsplash 이미지 검색 (예: community, group)"
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnsplashSearch(e)}
                className="pl-9 h-11 bg-white"
              />
              {unsplashQuery && (
                <Button 
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-9 w-9 p-0" 
                  onClick={handleUnsplashSearch}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
                </Button>
              )}
            </div>

            {unsplashResults.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-2 bg-white border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto">
                {unsplashResults.map((img) => (
                  <div 
                    key={img.id} 
                    className="aspect-square relative cursor-pointer rounded-md overflow-hidden hover:opacity-80"
                    onClick={() => setThumbnailUrl(img.urls.regular)}
                  >
                    <img src={img.urls.small} alt="Unsplash" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* [Right] Community Info Section (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Name Input */}
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-2 block">
              소모임 이름 *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="소모임 이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold h-12"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold text-slate-700 mb-2 block">
              한줄 소개
            </Label>
            <Textarea
              id="description"
              placeholder="소모임에 대한 간단한 소개를 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
              rows={4}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-slate-100">
        <Button 
          type="submit" 
          size="lg" 
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-full text-base font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "소모임 만들기"}
        </Button>
      </div>
    </form>
  )
}

