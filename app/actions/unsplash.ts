"use server"

import type { UnsplashSearchResponse } from "@/lib/types/unsplash"

export async function searchUnsplashImages(query: string): Promise<UnsplashSearchResponse> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  if (!accessKey) {
    return {
      success: false,
      error: "Unsplash API 키가 설정되지 않았습니다.",
    }
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&client_id=${accessKey}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Unsplash API error:", response.status, errorText)
      return {
        success: false,
        error: `검색 실패 (${response.status})`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      results: data.results || [],
    }
  } catch (error) {
    console.error("Unsplash search error:", error)
    return {
      success: false,
      error: "이미지 검색에 실패했습니다.",
    }
  }
}
