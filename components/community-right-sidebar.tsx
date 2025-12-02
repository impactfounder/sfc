"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Pencil, Crown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { setCommunityLeader } from "@/lib/actions/community"
import { useRouter } from "next/navigation"

interface CommunityRightSidebarProps {
  slug: string
}

interface CommunityData {
  id: string
  community_id?: string
  name: string
  description?: string | null
  created_by?: string | null
  creator_profile?: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
    company?: string | null
    position?: string | null
  } | null
  member_count?: number
  members?: Array<{
    id: string
    full_name?: string | null
    avatar_url?: string | null
    company?: string | null
    position?: string | null
    joined_at?: string
  }>
}

export function CommunityRightSidebar({ slug }: CommunityRightSidebarProps) {
  const [communityData, setCommunityData] = useState<CommunityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMemberForLeader, setSelectedMemberForLeader] = useState<string | null>(null)
  const [isSettingLeader, setIsSettingLeader] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchCommunityData() {
      try {
        setIsLoading(true)

        // 현재 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // 현재 사용자 프로필 가져오기 (권한 확인용)
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
          setCurrentUserProfile(profile)
        }

        // board_categories에서 커뮤니티 정보 가져오기
        const { data: category, error: categoryError } = await supabase
          .from("board_categories")
          .select("id, name, description, slug")
          .eq("slug", slug)
          .single()

        if (categoryError || !category) {
          console.error("커뮤니티 정보 로드 실패:", categoryError)
          setIsLoading(false)
          return
        }

        // communities 테이블에서 추가 정보 가져오기 (있는 경우)
        const { data: community } = await supabase
          .from("communities")
          .select(`
            id,
            name,
            description,
            created_by,
            profiles:created_by (
              id,
              full_name,
              avatar_url,
              company,
              position
            )
          `)
          .eq("name", category.name)
          .maybeSingle()

        // community_members에서 멤버 정보 가져오기
        let members: any[] = []
        let memberCount = 0

        if (community?.id) {
          const { data: communityMembers, error: membersError } = await supabase
            .from("community_members")
            .select(`
              user_id,
              joined_at,
              profiles:user_id (
                id,
                full_name,
                avatar_url,
                company,
                position
              )
            `)
            .eq("community_id", community.id)
            .order("joined_at", { ascending: false })
            .limit(10)

          if (!membersError && communityMembers) {
            members = communityMembers
              .map((cm: any) => ({
                id: cm.profiles?.id || cm.user_id,
                full_name: cm.profiles?.full_name || null,
                avatar_url: cm.profiles?.avatar_url || null,
                company: cm.profiles?.company || null,
                position: cm.profiles?.position || null,
                joined_at: cm.joined_at,
              }))
              .filter((m: any) => m.id) // 유효한 멤버만

            // 전체 멤버 수 카운트
            const { count } = await supabase
              .from("community_members")
              .select("*", { count: "exact", head: true })
              .eq("community_id", community.id)
            
            memberCount = count || 0
          }
        }

        const description = community ? (community.description || "") : (category.description || null)

        setCommunityData({
          id: category.id,
          community_id: community?.id,
          name: category.name,
          description: description,
          created_by: community?.created_by || null,
          creator_profile: (community?.profiles as any) || null,
          member_count: memberCount,
          members: members,
        })
        
        if (description) {
          setEditDescription(description)
        }
      } catch (error) {
        console.error("커뮤니티 데이터 로드 오류:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunityData()
  }, [slug, supabase])

  const handleUpdateDescription = async () => {
    if (!communityData?.community_id) return
    
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("communities")
        .update({ description: editDescription })
        .eq("id", communityData.community_id)
        .select()
        .single()

      if (error) throw error

      setCommunityData(prev => prev ? ({ ...prev, description: data?.description || editDescription }) : null)
      setIsDialogOpen(false)
      toast({ 
        title: "성공", 
        description: "가이드라인이 수정되었습니다." 
      })
    } catch (error: any) {
      console.error("커뮤니티 수정 오류:", error)
      // Supabase 에러 상세 정보 로깅
      if (error?.message) console.error("Error Message:", error.message)
      if (error?.details) console.error("Error Details:", error.details)
      if (error?.hint) console.error("Error Hint:", error.hint)
      
      toast({ 
        title: "오류", 
        description: `수정에 실패했습니다: ${error?.message || "알 수 없는 오류"}`, 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetLeader = async (memberId: string) => {
    if (!communityData?.community_id) return
    
    setIsSettingLeader(true)
    try {
      await setCommunityLeader(communityData.community_id, memberId)
      
      toast({ 
        title: "성공", 
        description: "커뮤니티 리더가 변경되었습니다." 
      })
      
      // 데이터 갱신
      router.refresh()
      
      // 로컬 상태도 즉시 업데이트
      setCommunityData(prev => {
        if (!prev) return null
        const targetMember = prev.members?.find(m => m.id === memberId)
        if (!targetMember) return prev
        
        return {
          ...prev,
          created_by: memberId,
          creator_profile: {
            id: targetMember.id,
            full_name: targetMember.full_name,
            avatar_url: targetMember.avatar_url,
            company: targetMember.company,
            position: targetMember.position
          }
        }
      })
      
      setSelectedMemberForLeader(null)
    } catch (error: any) {
      console.error("리더 지정 오류:", error)
      toast({ 
        title: "오류", 
        description: error?.message || "리더 지정에 실패했습니다.", 
        variant: "destructive" 
      })
    } finally {
      setIsSettingLeader(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!communityData) {
    return null
  }

  const isLeader = currentUser?.id && communityData.created_by === currentUser.id
  const isMaster = currentUserProfile?.role === 'master'

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: 커뮤니티 가이드라인 */}
      <Card className="bg-indigo-50 border-indigo-100 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📌</span>
              <h3 className="text-base font-bold text-slate-900">커뮤니티 가이드라인</h3>
            </div>
            {isLeader && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>커뮤니티 가이드라인 수정</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="guideline">가이드라인 내용</Label>
                      <Textarea 
                        id="guideline" 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="커뮤니티 멤버들이 지켜야 할 가이드라인을 입력해주세요."
                        className="min-h-[150px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>취소</Button>
                    <Button onClick={handleUpdateDescription} disabled={isSaving}>
                      {isSaving ? "저장 중..." : "저장하기"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {communityData.description ? (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {communityData.description}
            </div>
          ) : (
            <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
              <li>• 서로 존중하며 소통합니다</li>
              <li>• 건설적인 피드백을 제공합니다</li>
              <li>• 커뮤니티의 가치를 함께 만들어갑니다</li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Card 2: 커뮤니티 리더 */}
      {communityData.creator_profile && (
        <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👑</span>
              <h3 className="text-base font-bold text-slate-900">커뮤니티 리더</h3>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-amber-200">
                <AvatarImage src={communityData.creator_profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold">
                  {communityData.creator_profile.full_name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {communityData.creator_profile.full_name || "리더"}
                </p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 font-bold">
                리더
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3: 전체 클럽 멤버 */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">●</span>
            <h3 className="text-base font-bold text-slate-900">
              전체 클럽 멤버 {communityData.member_count ? `(${communityData.member_count}명)` : ""}
            </h3>
          </div>
          {communityData.members && communityData.members.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {communityData.members.map((member) => {
                  const isCurrentLeader = member.id === communityData.created_by
                  return (
                    <div key={member.id} className="flex items-center gap-3 group">
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                          {member.full_name?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {member.full_name || "멤버"}
                        </p>
                      </div>
                      {isMaster && !isCurrentLeader && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedMemberForLeader(member.id)}
                          title="리더로 지정"
                        >
                          <Crown className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      {isCurrentLeader && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 font-bold">
                          리더
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
              {communityData.member_count && communityData.member_count > communityData.members.length && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  disabled
                >
                  더보기 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">멤버가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* 리더 지정 확인 다이얼로그 */}
      <Dialog open={!!selectedMemberForLeader} onOpenChange={(open) => !open && setSelectedMemberForLeader(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>커뮤니티 리더 지정</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">
                {communityData.members?.find(m => m.id === selectedMemberForLeader)?.full_name}
              </span>
              님을 이 커뮤니티의 리더로 지정하시겠습니까?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              리더는 커뮤니티 가이드라인을 수정하고 커뮤니티를 관리할 수 있습니다.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedMemberForLeader(null)}
              disabled={isSettingLeader}
            >
              취소
            </Button>
            <Button 
              onClick={() => selectedMemberForLeader && handleSetLeader(selectedMemberForLeader)}
              disabled={isSettingLeader}
            >
              {isSettingLeader ? "처리 중..." : "지정하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
