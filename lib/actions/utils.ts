"use server"

/**
 * URL의 메타데이터를 가져와서 og:image를 추출하는 Server Action
 * @param url - 메타데이터를 가져올 URL
 * @returns og:image URL 또는 빈 문자열
 */
export async function fetchUrlMetadata(url: string): Promise<{ thumbnailUrl: string }> {
  try {
    // URL 유효성 검사
    if (!url || !url.trim()) {
      return { thumbnailUrl: "" }
    }

    // URL 형식 검증
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return { thumbnailUrl: "" }
    }

    // HTTP/HTTPS만 허용
    if (!["http:", "https:"].includes(validUrl.protocol)) {
      return { thumbnailUrl: "" }
    }

    // cheerio를 동적으로 import (서버 사이드에서만 사용)
    const cheerio = await import("cheerio")

    // URL에서 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      // 타임아웃 설정 (10초)
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return { thumbnailUrl: "" }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // og:image 메타 태그 찾기
    let thumbnailUrl = $('meta[property="og:image"]').attr("content") || 
                       $('meta[name="og:image"]').attr("content") || 
                       $('meta[property="twitter:image"]').attr("content") ||
                       ""

    // 상대 경로인 경우 절대 경로로 변환
    if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
      if (thumbnailUrl.startsWith("//")) {
        thumbnailUrl = `${validUrl.protocol}${thumbnailUrl}`
      } else if (thumbnailUrl.startsWith("/")) {
        thumbnailUrl = `${validUrl.origin}${thumbnailUrl}`
      } else {
        thumbnailUrl = `${validUrl.origin}/${thumbnailUrl}`
      }
    }

    return { thumbnailUrl: thumbnailUrl.trim() }
  } catch (error) {
    console.error("Error fetching URL metadata:", error)
    return { thumbnailUrl: "" }
  }
}

