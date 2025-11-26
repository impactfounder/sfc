import { useQuery } from "@tanstack/react-query"
import { fetchPosts } from "@/lib/api/posts"

export function usePosts(categorySlug: string, page: number = 1) {
  return useQuery({
    queryKey: ["posts", categorySlug, page], // 캐싱의 기준이 되는 키
    queryFn: () => fetchPosts({ categorySlug, page }),
    placeholderData: (previousData) => previousData, // 이전 데이터를 유지하며 새 데이터를 가져옴 (페이징 UX 개선)
    staleTime: 60 * 1000, // 1분간은 데이터를 fresh하게 유지 (재요청 안함)
  })
}

