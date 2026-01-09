"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * 커뮤니티 생성
 */
export async function createCommunity(data: {
  name: string
  description?: string
  thumbnail_url?: string
  is_private?: boolean
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다.", data: null }
  }

  // slug 생성 (이름 기반)
  const slug = data.name.trim().toLowerCase().replace(/\s+/g, '-')

  // 1. 커뮤니티 생성
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      thumbnail_url: data.thumbnail_url || null,
      created_by: user.id,
      is_private: data.is_private || false,
    })
    .select()
    .single()

  if (communityError) {
    return { error: communityError.message, data: null }
  }

  // 2. 생성자를 owner로 자동 등록
  const { error: memberError } = await supabase
    .from("community_members")
    .insert({
      community_id: community.id,
      user_id: user.id,
      role: "owner",
    })

  if (memberError) {
    // 커뮤니티는 생성됐지만 멤버 등록 실패 - 롤백은 어렵지만 에러 반환
    return { error: memberError.message, data: null }
  }

  // 3. board_categories에 게시판 등록
  const { error: boardError } = await supabase
    .from("board_categories")
    .insert({
      name: data.name.trim(),
      slug: slug,
      description: data.description?.trim() || null,
      is_active: true,
    })

  if (boardError) {
    console.error("[createCommunity] board_categories 생성 실패:", boardError)
    // 게시판 생성 실패해도 커뮤니티는 이미 생성됨 - 로그만 남김
  }

  revalidatePath("/community")
  revalidatePath("/communities")
  return { data: { ...community, slug }, error: null }
}

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

/**
 * 운영진 임명 (리더만 가능)
 */
export async function promoteMemberToAdmin(communityId: string, targetUserId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 커뮤니티 정보 조회
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single()

  if (!community) {
    return { error: "커뮤니티를 찾을 수 없습니다." }
  }

  // 권한 체크: owner(리더) 또는 master만 운영진 임명 가능
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: requesterMembership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single()

  const isOwner = community.created_by === user.id || requesterMembership?.role === "owner"
  const isMaster = profile?.role === "master"

  if (!isOwner && !isMaster) {
    return { error: "운영진 임명은 리더만 할 수 있습니다." }
  }

  // 대상 유저가 해당 커뮤니티의 멤버인지 확인
  const { data: targetMembership } = await supabase
    .from("community_members")
    .select("id, role")
    .eq("community_id", communityId)
    .eq("user_id", targetUserId)
    .single()

  if (!targetMembership) {
    return { error: "해당 유저는 커뮤니티 멤버가 아닙니다." }
  }

  if (targetMembership.role === "owner") {
    return { error: "리더는 운영진으로 변경할 수 없습니다." }
  }

  if (targetMembership.role === "admin") {
    return { error: "이미 운영진입니다." }
  }

  // 운영진으로 승격
  const { error } = await supabase
    .from("community_members")
    .update({ role: "admin" })
    .eq("id", targetMembership.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/community")
  revalidatePath(`/community/board/*`)
  return { success: true }
}

/**
 * 운영진 해제 (리더만 가능)
 */
export async function demoteAdminToMember(communityId: string, targetUserId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 커뮤니티 정보 조회
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single()

  if (!community) {
    return { error: "커뮤니티를 찾을 수 없습니다." }
  }

  // 권한 체크: owner(리더) 또는 master만 운영진 해제 가능
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: requesterMembership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single()

  const isOwner = community.created_by === user.id || requesterMembership?.role === "owner"
  const isMaster = profile?.role === "master"

  if (!isOwner && !isMaster) {
    return { error: "운영진 해제는 리더만 할 수 있습니다." }
  }

  // 대상 유저 멤버십 확인
  const { data: targetMembership } = await supabase
    .from("community_members")
    .select("id, role")
    .eq("community_id", communityId)
    .eq("user_id", targetUserId)
    .single()

  if (!targetMembership) {
    return { error: "해당 유저는 커뮤니티 멤버가 아닙니다." }
  }

  if (targetMembership.role !== "admin") {
    return { error: "해당 유저는 운영진이 아닙니다." }
  }

  // 일반 멤버로 변경
  const { error } = await supabase
    .from("community_members")
    .update({ role: "member" })
    .eq("id", targetMembership.id)

  if (error) {
    return { error: error.message }
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

/**
 * 커뮤니티 설정 업데이트 (운영자용)
 * - 이름, 소개글, 공개/비공개, 이용수칙 변경 가능
 */
/**
 * 커뮤니티 삭제 (owner만 가능)
 */
export async function deleteCommunity(communityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 해당 커뮤니티 정보 조회
  const { data: community } = await supabase
    .from("communities")
    .select("created_by, name")
    .eq("id", communityId)
    .single()

  if (!community) {
    return { error: "커뮤니티를 찾을 수 없습니다." }
  }

  // 권한 체크: owner 또는 master만 삭제 가능
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: ownerMember } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .single()

  const isOwner = community.created_by === user.id || !!ownerMember
  const isMaster = profile?.role === 'master'

  if (!isOwner && !isMaster) {
    return { error: "커뮤니티를 삭제할 권한이 없습니다. 소유자만 삭제할 수 있습니다." }
  }

  // 1. 관련 게시글 삭제 (board_categories를 통해)
  // 먼저 board_categories에서 slug 또는 name으로 찾기
  const slug = community.name.trim().toLowerCase().replace(/\s+/g, '-')
  let boardCategory = null

  // slug로 먼저 시도
  const { data: boardCatBySlug } = await supabase
    .from("board_categories")
    .select("id")
    .eq("slug", slug)
    .single()

  if (boardCatBySlug) {
    boardCategory = boardCatBySlug
  } else {
    // name으로 시도
    const { data: boardCatByName } = await supabase
      .from("board_categories")
      .select("id")
      .eq("name", community.name)
      .single()
    boardCategory = boardCatByName
  }

  console.log("[deleteCommunity] boardCategory:", boardCategory, "slug:", slug, "name:", community.name)

  if (boardCategory) {
    // 해당 게시판의 게시글 삭제
    const { error: postsError } = await supabase
      .from("posts")
      .delete()
      .eq("board_category_id", boardCategory.id)

    if (postsError) {
      console.error("[deleteCommunity] posts 삭제 실패:", postsError)
    }

    // board_categories 삭제
    const { error: boardCatError } = await supabase
      .from("board_categories")
      .delete()
      .eq("id", boardCategory.id)

    if (boardCatError) {
      console.error("[deleteCommunity] board_categories 삭제 실패:", boardCatError)
    }
  }

  // 2. 가입 신청 삭제
  const { error: joinReqError } = await supabase
    .from("community_join_requests")
    .delete()
    .eq("community_id", communityId)

  if (joinReqError) {
    console.error("[deleteCommunity] join_requests 삭제 실패:", joinReqError)
  }

  // 3. 멤버십 삭제
  console.log("[deleteCommunity] 멤버십 삭제 시도, communityId:", communityId)
  const { error: membersError } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)

  console.log("[deleteCommunity] 멤버십 삭제 결과, error:", membersError)

  if (membersError) {
    console.error("[deleteCommunity] members 삭제 실패:", membersError)
    return { error: "멤버십 삭제에 실패했습니다: " + membersError.message }
  }

  // 4. 커뮤니티 삭제
  console.log("[deleteCommunity] 커뮤니티 삭제 시도, id:", communityId)
  const { error, data: deletedData } = await supabase
    .from("communities")
    .delete()
    .eq("id", communityId)
    .select()

  console.log("[deleteCommunity] 커뮤니티 삭제 결과, error:", error, "deletedData:", deletedData)

  if (error) {
    console.error("[deleteCommunity] community 삭제 실패:", error)
    return { error: error.message }
  }

  // 삭제가 실제로 되었는지 확인
  const { data: checkDeleted } = await supabase
    .from("communities")
    .select("id")
    .eq("id", communityId)
    .single()

  if (checkDeleted) {
    console.error("[deleteCommunity] 커뮤니티가 여전히 존재함! RLS 정책 확인 필요")
    return { error: "삭제가 실패했습니다. 권한을 확인해주세요." }
  }

  console.log("[deleteCommunity] 삭제 완료:", communityId)

  revalidatePath("/community")
  revalidatePath("/communities")
  return { success: true }
}

export async function updateCommunitySettings(
  communityId: string,
  settings: {
    name?: string
    description?: string
    is_private?: boolean
    rules?: string
    thumbnail_url?: string
    banner_url?: string
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "로그인이 필요합니다." }
  }

  // 해당 커뮤니티 정보 조회
  const { data: community } = await supabase
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .single()

  if (!community) {
    return { error: "커뮤니티를 찾을 수 없습니다." }
  }

  // 권한 체크: owner, admin, 또는 master
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

  const isOwnerMember = adminMember?.role === "owner"
  const isOwner = community.created_by === user.id || isOwnerMember
  const isMaster = profile?.role === 'master'
  const isAdmin = !!adminMember

  if (!isOwner && !isMaster && !isAdmin) {
    return { error: "설정을 변경할 권한이 없습니다." }
  }

  // 이름 변경은 리더(owner)와 마스터만 가능
  if (settings.name && !isOwner && !isMaster) {
    return { error: "커뮤니티 이름은 리더만 변경할 수 있습니다." }
  }

  // 설정 업데이트
  const { error } = await supabase
    .from("communities")
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", communityId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/community")
  revalidatePath("/community/board/*")
  revalidatePath(`/communities/${communityId}`)
  return { success: true }
}
