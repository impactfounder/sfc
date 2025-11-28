/**
 * Unsplash API 관련 타입 정의
 */

export type UnsplashImage = {
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
}

export type UnsplashSearchResponse = {
  success: boolean
  results?: UnsplashImage[]
  error?: string
}

