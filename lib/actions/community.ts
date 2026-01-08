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
    return { error: "로그인이 필요합니다.", success: false }
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
      return { error: "이미 참여한 커뮤니티입니다.", success: false }
    }
    return { error: error.message, success: false }
  }

  revalidatePath("/community")
  return { success: true, error: null }
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다.", success: false }
  }

  // communities 테이블에서 멤버십 제거
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/community")
  return { success: true, error: null }
}

// ============================================
// 가입 신청 관련 함수 (승인제 커뮤니티)
// ============================================

/**
 * 커뮤니티 가입 신청 (승인제)
 */
export async function requestJoinCommunity(communityId: string, message?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 이미 멤버인지 확인
  const { data: existingMember } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single()

  if (existingMember) {
    return { error: "이미 가입된 커뮤니티입니다." }
  }

  // 가입 신청
  const { error } = await supabase
    .from("community_join_requests")
    .insert({
      community_id: communityId,
      user_id: user.id,
      message: message || null,
    })

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 가입 신청 중입니다." }
    }
    return { error: error.message }
  }

  revalidatePath("/community")
  return { success: true }
}

/**
 * 가입 신청 승인 (운영자용)
 */
export async function approveJoinRequest(requestId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 가입 신청 정보 조회
  const { data: request, error: requestError } = await supabase
    .from("community_join_requests")
    .select("community_id, user_id, status")
    .eq("id", requestId)
    .single()

  if (requestError || !request) {
    return { error: "가입 신청을 찾을 수 없습니다." }
  }

  if (request.status !== "pending") {
    return { error: "이미 처리된 신청입니다." }
  }

  // 권한 확인 (커뮤니티 운영자 또는 master)
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", request.community_id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: adminMember } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", request.community_id)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  const isOwner = community?.created_by === user.id
  const isMaster = profile?.role === "master"
  const isAdmin = !!adminMember

  if (!isOwner && !isMaster && !isAdmin) {
    return { error: "권한이 없습니다." }
  }

  // 트랜잭션: 신청 승인 + 멤버 추가
  const { error: updateError } = await supabase
    .from("community_join_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId)

  if (updateError) {
    return { error: updateError.message }
  }

  // 멤버 추가
  const { error: memberError } = await supabase
    .from("community_members")
    .insert({
      community_id: request.community_id,
      user_id: request.user_id,
      role: "member",
    })

  if (memberError) {
    // 이미 멤버인 경우 무시
    if (memberError.code !== "23505") {
      return { error: memberError.message }
    }
  }

  revalidatePath("/community")
  return { success: true }
}

/**
 * 가입 신청 거절 (운영자용)
 */
export async function rejectJoinRequest(requestId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 가입 신청 정보 조회
  const { data: request, error: requestError } = await supabase
    .from("community_join_requests")
    .select("community_id, status")
    .eq("id", requestId)
    .single()

  if (requestError || !request) {
    return { error: "가입 신청을 찾을 수 없습니다." }
  }

  if (request.status !== "pending") {
    return { error: "이미 처리된 신청입니다." }
  }

  // 권한 확인
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", request.community_id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: adminMember } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", request.community_id)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  const isOwner = community?.created_by === user.id
  const isMaster = profile?.role === "master"
  const isAdmin = !!adminMember

  if (!isOwner && !isMaster && !isAdmin) {
    return { error: "권한이 없습니다." }
  }

  // 신청 거절
  const { error: updateError } = await supabase
    .from("community_join_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: reason || null,
    })
    .eq("id", requestId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/community")
  return { success: true }
}

/**
 * 가입 신청 취소 (신청자용)
 */
export async function cancelJoinRequest(communityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  const { error } = await supabase
    .from("community_join_requests")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .eq("status", "pending")

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/community")
  return { success: true }
}

/**
 * 커뮤니티 가입 신청 목록 조회 (운영자용)
 */
export async function getPendingJoinRequests(communityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다.", data: null }
  }

  // 권한 확인
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: adminMember } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  const isOwner = community?.created_by === user.id
  const isMaster = profile?.role === "master"
  const isAdmin = !!adminMember

  if (!isOwner && !isMaster && !isAdmin) {
    return { error: "권한이 없습니다.", data: null }
  }

  // 대기 중인 가입 신청 목록
  const { data, error } = await supabase
    .from("community_join_requests")
    .select(`
      id,
      message,
      created_at,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        company,
        position
      )
    `)
    .eq("community_id", communityId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
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
