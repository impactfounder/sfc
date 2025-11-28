"use server"

import type { UnsplashSearchResponse, UnsplashImage } from "@/lib/types/unsplash"

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

/**
 * Unsplash API를 사용하여 이미지를 검색하는 서버 액션
 * @param query 검색어
 * @returns UnsplashSearchResponse 타입의 검색 결과
 */
export async function searchUnsplashImages(query: string): Promise<UnsplashSearchResponse> {
  console.log("Unsplash 검색 요청:", query)

  if (!UNSPLASH_ACCESS_KEY) {
    console.error("Unsplash API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.")
    return {
      success: false,
      error: "서버 설정 오류: Unsplash API 키가 없습니다.",
    }
  }

  if (!query || query.trim().length === 0) {
    return {
      success: true,
      results: [],
    }
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query.trim())}&per_page=20&client_id=${UNSPLASH_ACCESS_KEY}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      let errorData: { errors?: string[] } = {}
      try {
        errorData = await response.json()
      } catch {
        // JSON 파싱 실패 시 빈 객체 사용
      }

      console.error("Unsplash API 호출 에러:", response.status, errorData)

      // Rate Limit 등 구체적인 에러 메시지 전달
      if (response.status === 403) {
        return {
          success: false,
          error: "Unsplash API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
        }
      }

      if (response.status === 401) {
        return {
          success: false,
          error: "Unsplash API 인증에 실패했습니다. API 키를 확인해주세요.",
        }
      }

      return {
        success: false,
        error: errorData.errors?.[0] || `Unsplash API 오류: ${response.status}`,
      }
    }

    const data = await response.json() as {
      results?: Array<{
        id: string
        urls: {
          thumb: string
          small: string
          regular: string
          full: string
        }
        alt_description: string | null
        description: string | null
        width: number
        height: number
        user: {
          name: string
          username: string
        }
      }>
    }

    console.log(`Unsplash 검색 성공: ${data.results?.length || 0}개 결과 반환`)

    // UnsplashImage 타입에 맞게 변환
    const images: UnsplashImage[] = (data.results || []).map((item) => ({
      id: item.id,
      urls: {
        thumb: item.urls.thumb,
        small: item.urls.small,
        regular: item.urls.regular,
        full: item.urls.full,
      },
      alt_description: item.alt_description,
      description: item.description,
      width: item.width,
      height: item.height,
      user: {
        name: item.user.name,
        username: item.user.username,
      },
    }))

    return {
      success: true,
      results: images,
    }
  } catch (error) {
    console.error("Unsplash 이미지 검색 중 예외 발생:", error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "이미지 검색 중 알 수 없는 오류가 발생했습니다."

    return {
      success: false,
      error: errorMessage,
    }
  }
}
