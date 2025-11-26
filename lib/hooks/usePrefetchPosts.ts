import { useQueryClient } from "@tanstack/react-query"
import { fetchPosts } from "@/lib/api/posts"

export function usePrefetchPosts() {
  const queryClient = useQueryClient()

  const prefetch = (categorySlug: string) => {
    queryClient.prefetchQuery({
      queryKey: ["posts", categorySlug, 1], // 1페이지 데이터를 미리 가져옴
      queryFn: () => fetchPosts({ categorySlug, page: 1 }),
      staleTime: 60 * 1000, // 1분간은 신선한 것으로 간주
    })
  }

  return prefetch
}

