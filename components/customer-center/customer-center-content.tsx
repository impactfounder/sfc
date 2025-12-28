"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInquiry } from "@/lib/actions/inquiries"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function CustomerCenterContent() {
  const [inquiryType, setInquiryType] = useState("")
  const [inquiryTitle, setInquiryTitle] = useState("")
  const [inquiryContent, setInquiryContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inquiryType || !inquiryTitle.trim() || !inquiryContent.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createInquiry({
        type: inquiryType,
        title: inquiryTitle,
        content: inquiryContent,
      })

      toast({
        title: "문의 등록 완료",
        description: "소중한 의견 감사합니다. 빠른 시일 내에 답변드리겠습니다.",
      })

      // 폼 초기화
      setInquiryType("")
      setInquiryTitle("")
      setInquiryContent("")
    } catch (error) {
      console.error("문의 등록 실패:", error)
      toast({
        title: "문의 등록 실패",
        description: error instanceof Error ? error.message : "문의 등록에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const mainContent = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-2xl font-bold text-slate-900">고객센터</h1>
        <p className="text-slate-600">궁금한 점이 있으시면 언제든지 문의해주세요.</p>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5 text-indigo-600" />
            문의하기
          </CardTitle>
          <CardDescription>
            서비스 이용 중 불편한 점이나 제안하고 싶은 내용이 있다면 언제든 말씀해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-slate-900">
                문의 유형 <span className="text-red-500">*</span>
              </Label>
              <Select value={inquiryType} onValueChange={setInquiryType} required>
                <SelectTrigger id="type" className="bg-white">
                  <SelectValue placeholder="문의 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service_inquiry">서비스 이용문의</SelectItem>
                  <SelectItem value="bug_report">오류 제보</SelectItem>
                  <SelectItem value="feature_request">기능 제안</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-slate-900">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="문의 제목을 입력하세요"
                value={inquiryTitle}
                onChange={(e) => setInquiryTitle(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-slate-900">
                내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="문의 내용을 자세히 입력하세요"
                value={inquiryContent}
                onChange={(e) => setInquiryContent(e.target.value)}
                required
                rows={10}
                className="resize-none bg-white"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  "문의 등록하기"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )

  return mainContent
}
