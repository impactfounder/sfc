"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"

// FAQ 더미 데이터
const faqData = {
  "이용 방법": [
    {
      question: "서울 파운더스 클럽은 어떤 서비스인가요?",
      answer: "서울 파운더스 클럽은 서울을 기반으로 활동하는 창업가, 투자자, 크리에이터가 모여 신뢰를 바탕으로 연결되고 함께 성장하는 비즈니스 커뮤니티입니다. 네트워킹, 이벤트, 프로젝트 협업 등 다양한 기능을 제공합니다.",
    },
    {
      question: "회원가입은 어떻게 하나요?",
      answer: "홈페이지 상단의 '가입하기' 버튼을 클릭하시면 간단한 정보 입력으로 회원가입이 가능합니다. 소셜 로그인(구글, 깃허브 등)을 통해서도 빠르게 가입하실 수 있습니다.",
    },
  ],
  "결제 문의": [
    {
      question: "멤버십 요금제는 어떻게 되나요?",
      answer: "현재 무료 플랜과 프리미엄 플랜을 제공하고 있습니다. 무료 플랜으로도 기본적인 커뮤니티 기능을 이용하실 수 있으며, 프리미엄 플랜에서는 고급 이벤트 참여, 프로젝트 협업 도구 등 추가 기능을 이용하실 수 있습니다.",
    },
    {
      question: "환불 정책은 어떻게 되나요?",
      answer: "프리미엄 플랜의 경우, 구매 후 7일 이내에 환불 요청 시 전액 환불이 가능합니다. 환불은 고객센터를 통해 신청하실 수 있으며, 영업일 기준 3-5일 내에 처리됩니다.",
    },
  ],
  "뱃지 관련": [
    {
      question: "뱃지는 어떻게 획득하나요?",
      answer: "뱃지는 다양한 활동을 통해 획득할 수 있습니다. 예를 들어, 이벤트 참여, 프로젝트 완료, 커뮤니티 기여도 등에 따라 뱃지가 부여됩니다. 프로필 페이지에서 현재 보유한 뱃지를 확인하실 수 있습니다.",
    },
  ],
}

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

  return (
    <div className="w-full flex flex-col gap-10">
      <PageHeader
        title="고객센터"
        description="궁금한 점이 있으시면 언제든지 문의해주세요."
      />

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="faq">자주 묻는 질문</TabsTrigger>
          <TabsTrigger value="inquiry">1:1 문의 및 의견 보내기</TabsTrigger>
        </TabsList>

        {/* 탭 1: 자주 묻는 질문 */}
        <TabsContent value="faq" className="mt-6">
          <div className="space-y-6">
            {Object.entries(faqData).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{category}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {items.map((item, index) => (
                    <AccordionItem key={index} value={`${category}-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 탭 2: 1:1 문의 및 의견 보내기 */}
        <TabsContent value="inquiry" className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-slate-900">
                문의 유형 <span className="text-red-500">*</span>
              </Label>
              <Select value={inquiryType} onValueChange={setInquiryType} required>
                <SelectTrigger id="type">
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
                className="resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
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
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

