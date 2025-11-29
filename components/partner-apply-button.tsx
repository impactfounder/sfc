"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type PartnerApplyButtonProps = {
  partnerId?: string
  partnerName: string
  serviceTitle: string
}

export function PartnerApplyButton({ partnerId, partnerName, serviceTitle }: PartnerApplyButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    serviceDescription: "",
    currentUsage: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName.trim() || !formData.contactEmail.trim() || !formData.serviceDescription.trim()) {
      toast({
        variant: "destructive",
        title: "입력 필요",
        description: "필수 항목을 모두 입력해주세요.",
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "로그인 필요",
          description: "신청하려면 로그인이 필요합니다.",
        })
        router.push("/auth/login")
        return
      }

      const { error } = await supabase
        .from("partner_applications")
        .insert({
          user_id: user.id,
          partner_id: partnerId || null,
          partner_name: partnerName,
          company_name: formData.companyName.trim(),
          contact_email: formData.contactEmail.trim(),
          contact_phone: formData.contactPhone.trim() || null,
          service_description: formData.serviceDescription.trim(),
          current_usage: formData.currentUsage.trim() || null,
          status: "pending",
        })

      if (error) throw error

      toast({
        title: "신청 완료",
        description: "파트너 혜택 신청이 완료되었습니다. 검토 후 연락드리겠습니다.",
      })

      setIsDialogOpen(false)
      setFormData({
        companyName: "",
        contactEmail: "",
        contactPhone: "",
        serviceDescription: "",
        currentUsage: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Partner application error:", error)
      toast({
        variant: "destructive",
        title: "신청 실패",
        description: error instanceof Error ? error.message : "신청 중 오류가 발생했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation()
          setIsDialogOpen(true)
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        파트너스 신청하기
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>파트너 혜택 신청</DialogTitle>
            <DialogDescription>
              {serviceTitle}의 제휴 혜택을 신청하시려면 아래 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                회사명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="회사 또는 조직명을 입력하세요"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
                이메일 <span className="text-red-500">*</span>
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
              <Label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
                연락처
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="010-1234-5678"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="serviceDescription" className="text-sm font-medium text-slate-700">
                서비스 설명 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                placeholder="어떤 서비스를 이용하고 계신지 간단히 설명해주세요"
                rows={4}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="currentUsage" className="text-sm font-medium text-slate-700">
                현재 이용 여부
              </Label>
              <Input
                id="currentUsage"
                value={formData.currentUsage}
                onChange={(e) => setFormData({ ...formData, currentUsage: e.target.value })}
                placeholder="예: 현재 이용 중 / 이용 예정"
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    신청 중...
                  </>
                ) : (
                  "신청하기"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

