"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createPartnerProposal } from "@/lib/actions/partner-proposals"
import { fetchUrlMetadata } from "@/lib/actions/utils"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

type PartnerProposalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PartnerProposalDialog({ open, onOpenChange }: PartnerProposalDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingThumbnail, setIsFetchingThumbnail] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    companyName: "",
    serviceName: "",
    websiteUrl: "",
    benefitProposal: "",
  })
  const { toast } = useToast()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // URL에서 썸네일 추출 함수
  const handleFetchThumbnail = async (url: string) => {
    if (!url || !url.trim()) {
      setThumbnailUrl("")
      return
    }

    // URL 형식 검증
    try {
      new URL(url)
    } catch {
      setThumbnailUrl("")
      return
    }

    setIsFetchingThumbnail(true)
    try {
      const result = await fetchUrlMetadata(url)
      if (result.thumbnailUrl) {
        setThumbnailUrl(result.thumbnailUrl)
      } else {
        setThumbnailUrl("")
      }
    } catch (error) {
      console.error("Failed to fetch thumbnail:", error)
      setThumbnailUrl("")
    } finally {
      setIsFetchingThumbnail(false)
    }
  }

  // 웹사이트 URL 변경 핸들러 (디바운스 적용)
  const handleWebsiteUrlChange = (value: string) => {
    setFormData({ ...formData, websiteUrl: value })
    setThumbnailUrl("") // 초기화

    // 디바운스: 입력이 멈춘 후 1초 뒤에 썸네일 가져오기
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (value && value.trim()) {
        handleFetchThumbnail(value)
      }
    }, 1000)
  }

  // 웹사이트 URL 포커스 아웃 핸들러
  const handleWebsiteUrlBlur = () => {
    if (formData.websiteUrl && formData.websiteUrl.trim() && !thumbnailUrl) {
      handleFetchThumbnail(formData.websiteUrl)
    }
  }

  // 다이얼로그가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setFormData({
        contactName: "",
        contactEmail: "",
        companyName: "",
        serviceName: "",
        websiteUrl: "",
        benefitProposal: "",
      })
      setThumbnailUrl("")
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 필수 필드 검증
    if (
      !formData.contactName.trim() ||
      !formData.contactEmail.trim() ||
      !formData.companyName.trim() ||
      !formData.serviceName.trim() ||
      !formData.benefitProposal.trim()
    ) {
      toast({
        variant: "destructive",
        title: "입력 필요",
        description: "필수 항목을 모두 입력해주세요.",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await createPartnerProposal({
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        companyName: formData.companyName,
        serviceName: formData.serviceName,
        websiteUrl: formData.websiteUrl,
        benefitProposal: formData.benefitProposal,
        thumbnailUrl: thumbnailUrl,
      })

      // 성공 응답 확인
      if (result && result.success === false) {
        throw new Error(result.error || "신청 중 오류가 발생했습니다.")
      }

      toast({
        title: "신청 완료",
        description: "신청이 접수되었습니다. 담당자가 검토 후 연락드립니다.",
      })

      // 폼 초기화
      setFormData({
        contactName: "",
        contactEmail: "",
        companyName: "",
        serviceName: "",
        websiteUrl: "",
        benefitProposal: "",
      })
      setThumbnailUrl("")

      onOpenChange(false)
    } catch (error) {
      console.error("Partner proposal error:", error)
      
      // 에러 메시지 추출
      let errorMessage = "신청 중 오류가 발생했습니다."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }

      // DB 테이블 관련 에러인 경우 더 명확한 메시지
      if (errorMessage.includes("table") || errorMessage.includes("relation") || errorMessage.includes("does not exist")) {
        errorMessage = "데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      }

      toast({
        variant: "destructive",
        title: "신청 실패",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>제휴 파트너 신청</DialogTitle>
          <DialogDescription>
            SFC와 제휴를 원하시는 파트너사 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="contactName" className="text-sm font-medium text-slate-700">
              담당자 성함 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="홍길동"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
              연락처 (이메일) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@example.com"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
              회사명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="(주)회사명"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="serviceName" className="text-sm font-medium text-slate-700">
              서비스명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="serviceName"
              value={formData.serviceName}
              onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              placeholder="서비스 또는 제품명"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="websiteUrl" className="text-sm font-medium text-slate-700">
              웹사이트 URL
            </Label>
            <Input
              id="websiteUrl"
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleWebsiteUrlChange(e.target.value)}
              onBlur={handleWebsiteUrlBlur}
              placeholder="https://example.com"
              className="mt-1.5"
            />
            {isFetchingThumbnail && (
              <p className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                썸네일 이미지를 가져오는 중...
              </p>
            )}
            {thumbnailUrl && !isFetchingThumbnail && (
              <div className="mt-3">
                <Label className="text-xs text-slate-600 mb-2 block">사이트 썸네일 미리보기</Label>
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <Image
                    src={thumbnailUrl}
                    alt="Website thumbnail"
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                    onError={() => setThumbnailUrl("")}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="benefitProposal" className="text-sm font-medium text-slate-700">
              제안할 혜택 내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="benefitProposal"
              value={formData.benefitProposal}
              onChange={(e) => setFormData({ ...formData, benefitProposal: e.target.value })}
              placeholder="예: 3개월 무료 이용권 제공, 첫 달 50% 할인 등"
              rows={4}
              className="mt-1.5"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                "신청하기"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

