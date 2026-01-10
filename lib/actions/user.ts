"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * 일일 로그인 포인트 체크 (서버 액션)
 */
export async function checkDailyLoginPoints() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // RPC 함수 호출
    const { error } = await supabase.rpc("check_daily_login_points")

    if (error) {
      console.error("Failed to check daily login points:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("checkDailyLoginPoints error:", error)
    return { success: false, error: "Failed to check daily login points" }
  }
}

/**
 * 사용자가 가입한 커뮤니티 목록 조회 (서버 액션)
 */
export async function getJoinedCommunities() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, data: [], error: "Unauthorized" }
    }

    // 멤버십 조회
    const { data: memberships, error: membershipsError } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id)

    if (membershipsError) {
      console.error("[getJoinedCommunities] memberships error:", membershipsError)
      return { success: false, data: [], error: membershipsError.message }
    }

    if (!memberships || memberships.length === 0) {
      return { success: true, data: [] }
    }

    const communityIds = memberships.map((m) => m.community_id)

    // 커뮤니티 정보 조회
    const { data: communities, error: communitiesError } = await supabase
      .from("communities")
      .select("id, name")
      .in("id", communityIds)

    if (communitiesError) {
      console.error("[getJoinedCommunities] communities error:", communitiesError)
      return { success: false, data: [], error: communitiesError.message }
    }

    if (!communities || communities.length === 0) {
      return { success: true, data: [] }
    }

    const communityNames = communities.map((c) => c.name)

    // board_categories에서 slug 조회
    const { data: categories } = await supabase
      .from("board_categories")
      .select("name, slug")
      .in("name", communityNames)

    const result = communities.map((community) => {
      const category = categories?.find((c) => c.name === community.name)
      return {
        id: community.id,
        name: community.name,
        slug: category?.slug || community.name.toLowerCase().replace(/\s+/g, '-'),
      }
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("[getJoinedCommunities] error:", error)
    return { success: false, data: [], error: "Failed to get joined communities" }
  }
}

export async function updateProfileAvatar(avatarUrl: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Update avatar_url in profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  return { success: true }
}

export async function updateProfileVisibility(isPublic: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Update is_profile_public in profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ is_profile_public: isPublic })
    .eq("id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  revalidatePath("/member")
  return { success: true }
}

export async function updateProfileInfo(data: {
  full_name?: string
  company?: string
  position?: string
  company_2?: string
  position_2?: string
  tagline?: string
  introduction?: string
  member_type?: ("사업가" | "투자자" | "크리에이터")[] | null
  is_profile_public?: boolean
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Unauthorized")
    }

    // Update profile info
    // null 값 처리를 명확하게 하여 DB 에러 방지
    // member_type 유효성 검사 및 정리
    let memberTypeValue: string[] | null = null
    if (Array.isArray(data.member_type) && data.member_type.length > 0) {
      // 허용된 값만 필터링하고 중복 제거
      const allowedValues = ['사업가', '투자자', '크리에이터']
      const filtered = data.member_type
        .filter((v): v is "사업가" | "투자자" | "크리에이터" => 
          typeof v === 'string' && allowedValues.includes(v)
        )
      // 중복 제거
      const unique = Array.from(new Set(filtered))
      // 최대 2개까지만, 그리고 최소 1개 이상이어야 함
      if (unique.length > 0 && unique.length <= 2) {
        memberTypeValue = unique.slice(0, 2)
      } else {
        memberTypeValue = null
      }
    }
    
    // 최종 검증: 빈 배열이면 null로 변환
    if (Array.isArray(memberTypeValue) && memberTypeValue.length === 0) {
      memberTypeValue = null
    }
    
    // 디버깅 로그
    console.log('[updateProfileInfo] member_type 처리:', {
      input: data.member_type,
      processed: memberTypeValue,
      isArray: Array.isArray(memberTypeValue),
      length: Array.isArray(memberTypeValue) ? memberTypeValue.length : null
    })
    
    const updates: any = {
      full_name: data.full_name?.trim() || null,
      company: data.company?.trim() || null,
      position: data.position?.trim() || null,
      company_2: data.company_2?.trim() || null,
      position_2: data.position_2?.trim() || null,
      tagline: data.tagline?.trim() || null,
      introduction: data.introduction?.trim() || null,
      member_type: memberTypeValue,
      is_profile_public: data.is_profile_public ?? false,
      updated_at: new Date().toISOString(),
    }
    
    // 최종 업데이트 객체 검증
    if (Array.isArray(updates.member_type)) {
      if (updates.member_type.length === 0) {
        updates.member_type = null
      } else if (updates.member_type.length > 2) {
        updates.member_type = updates.member_type.slice(0, 2)
      }
    }

    // 최종 업데이트 전 검증 로그
    console.log('[updateProfileInfo] 최종 업데이트 객체:', {
      member_type: updates.member_type,
      member_type_type: typeof updates.member_type,
      isArray: Array.isArray(updates.member_type),
      length: Array.isArray(updates.member_type) ? updates.member_type.length : null
    })
    
    // 1. 전체 업데이트 시도
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)

    if (error) {
      console.error("Supabase Update Error (Full):", error)
      console.error("업데이트 시도한 데이터:", JSON.stringify(updates, null, 2))
      
      // member_type 관련 체크 제약 조건 오류인 경우
      if (error.message.includes("profiles_member_type_check")) {
        console.error("member_type 체크 제약 조건 위반!")
        console.error("member_type 값:", updates.member_type)
        console.error("member_type 타입:", typeof updates.member_type)
        console.error("member_type isArray:", Array.isArray(updates.member_type))
        if (Array.isArray(updates.member_type)) {
          console.error("member_type length:", updates.member_type.length)
          console.error("member_type 내용:", updates.member_type)
        }
        // member_type을 null로 설정하고 재시도
        const safeUpdates = { ...updates, member_type: null }
        const { error: retryError } = await supabase
          .from("profiles")
          .update(safeUpdates)
          .eq("id", user.id)
        if (retryError) {
          throw new Error(`member_type 저장 실패: ${error.message}. 기본 정보만 저장되었습니다.`)
        }
        return { success: true, warning: "member_type 저장에 실패했습니다. 기본 정보는 저장되었습니다." }
      }
      
      // 2. 만약 컬럼 없음 에러라면 기본 정보만이라도 업데이트 시도
      // company_2, position_2도 없을 수 있으므로, 가장 기본 컬럼들만 업데이트 시도
      if (error.code === 'PGRST204' || error.message.includes("Could not find the")) {
        console.log("Retrying update with minimal columns...")
        const basicUpdates = {
          full_name: updates.full_name,
          company: updates.company,
          position: updates.position,
          introduction: updates.introduction,
          is_profile_public: updates.is_profile_public,
          updated_at: updates.updated_at,
        }
        const { error: retryError } = await supabase
          .from("profiles")
          .update(basicUpdates)
          .eq("id", user.id)
          
        if (retryError) {
          throw new Error(retryError.message)
        }
        // 부분 성공
        return { success: true, warning: "기본 정보는 저장되었으나, 추가 정보(두 번째 소속, 소셜 링크 등) 저장에 실패했습니다. (DB 업데이트 필요)" }
      }
      
      throw new Error(error.message)
    }

    revalidatePath("/community/profile")
    revalidatePath("/member")
    return { success: true }
    
  } catch (error) {
    console.error("updateProfileInfo Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile"
    return { success: false, error: errorMessage }
  }
}
