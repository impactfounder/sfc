"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateCommunityIntro(intro: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // 권한 체크: master 또는 community_leader
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, roles")
    .eq("id", user.id)
    .single()

  const isMaster = profile?.role === 'master'
  const isLeader = profile?.roles?.includes('community_leader')

  if (!isMaster && !isLeader) {
    throw new Error("Forbidden")
  }

  // community_settings 테이블에 저장 (upsert)
  const { error } = await supabase
    .from("community_settings")
    .upsert({ 
      key: 'community_intro', 
      value: intro,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community")
  return { success: true }
}

export async function setCommunityLeader(communityId: string, targetUserId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // 권한 체크: master만 리더 지정 가능
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (requesterProfile?.role !== 'master') {
    throw new Error("Forbidden: Only masters can designate community leaders")
  }

  // 대상 유저가 해당 커뮤니티의 멤버인지 확인
  const { data: membership } = await supabase
    .from("community_members")
    .select("id, role")
    .eq("community_id", communityId)
    .eq("user_id", targetUserId)
    .single()

  if (!membership) {
    throw new Error("User is not a member of this community")
  }

  // 1) communities 테이블의 created_by를 업데이트 (리더 변경)
  const { error: updateCommunityError } = await supabase
    .from("communities")
    .update({ created_by: targetUserId })
    .eq("id", communityId)

  if (updateCommunityError) {
    throw new Error(updateCommunityError.message)
  }

  // 2) community_members.role을 리더 권한으로 승격
  //    - 기존에는 role이 항상 'member'로 남아 있어서
  //      리더 뱃지 자동 발급 트리거가 동작하지 않았음
  const { error: updateRoleError } = await supabase
    .from("community_members")
    .update({ role: "admin" })
    .eq("id", membership.id)

  if (updateRoleError) {
    throw new Error(updateRoleError.message)
  }

  revalidatePath("/community")
  revalidatePath(`/community/board/*`)
  return { success: true }
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // communities 테이블에 멤버십 추가
  const { error } = await supabase
    .from("community_members")
    .insert({
      community_id: communityId,
      user_id: user.id,
      joined_at: new Date().toISOString()
    })

  if (error) {
    if (error.code === '23505') { // unique constraint violation
      throw new Error("이미 참여한 커뮤니티입니다.")
    }
    throw new Error(error.message)
  }

  revalidatePath("/community")
  return { success: true }
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // communities 테이블에서 멤버십 제거
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community")
  return { success: true }
}

export async function updateCommunityDescription(communityId: string, description: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // 해당 커뮤니티의 리더인지 확인
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single()

  if (!community) {
    throw new Error("Community not found")
  }

  // 권한 체크: 리더 또는 master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isLeader = community.created_by === user.id
  const isMaster = profile?.role === 'master'

  if (!isLeader && !isMaster) {
    throw new Error("Forbidden: Only community leader or master can update description")
  }

  // description 업데이트
  const { error } = await supabase
    .from("communities")
    .update({ description })
    .eq("id", communityId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community")
  revalidatePath("/community/board/*")
  return { success: true }
}
