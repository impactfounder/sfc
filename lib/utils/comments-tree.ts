import type { CommentNode } from "@/lib/actions/comments"

// 플랫한 댓글 목록을 트리로 변환
export function buildCommentTree(flat: CommentNode[]): CommentNode[] {
  const map = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  flat.forEach((node) => {
    map.set(node.id, { ...node, children: [] })
  })

  flat.forEach((node) => {
    const current = map.get(node.id)!
    if (node.parent_id) {
      const parent = map.get(node.parent_id)
      if (parent) {
        parent.children?.push(current)
      } else {
        roots.push(current) // parent가 없으면 루트 취급 (데이터 보호)
      }
    } else {
      roots.push(current)
    }
  })

  return roots
}


