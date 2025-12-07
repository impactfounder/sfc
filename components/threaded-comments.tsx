"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CommentNode, createComment } from "@/lib/actions/comments"
import { cn } from "@/lib/utils"

type ThreadedCommentsProps = {
  postId: string
  userId?: string
  comments: CommentNode[]
}

export function ThreadedComments({ postId, userId, comments }: ThreadedCommentsProps) {
  const [tree, setTree] = useState<CommentNode[]>(comments)

  const handleAdd = async (content: string, parentId: string | null) => {
    if (!content.trim()) return
    const optimistic: CommentNode = {
      id: `temp-${Math.random().toString(36).slice(2)}`,
      post_id: postId,
      author_id: userId || "",
      content,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      depth: parentId ? 1 : 0,
      profiles: undefined,
      children: [],
    }
    setTree((prev) => insertIntoTree(prev, optimistic))
    try {
      const saved = await createComment({ postId, content, parentId })
      setTree((prev) => replaceTemp(prev, optimistic.id, saved))
    } catch (e) {
      // 실패 시 롤백
      setTree((prev) => removeNode(prev, optimistic.id))
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <CommentForm postId={postId} userId={userId} onSubmit={(c) => handleAdd(c, null)} />
      <div className="space-y-4">
        {tree.map((comment) => (
          <CommentItem key={comment.id} comment={comment} depth={0} onReply={(c) => handleAdd(c, comment.id)} userId={userId} />
        ))}
      </div>
    </div>
  )
}

function CommentItem({ comment, depth, onReply, userId }: { comment: CommentNode; depth: number; onReply: (content: string) => void; userId?: string }) {
  const [showReply, setShowReply] = useState(false)

  return (
    <div className={cn("space-y-2", depth > 0 && "border-l border-slate-200 pl-4")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
          <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-semibold">
            {comment.profiles?.full_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-900 text-sm">{comment.profiles?.full_name || "익명"}</span>
            <span>{new Date(comment.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
              onClick={() => setShowReply((v) => !v)}
            >
              답글 달기
            </Button>
          </div>
          {showReply && (
            <div className="mt-2">
              <CommentForm
                postId={comment.post_id}
                userId={userId}
                onSubmit={(c) => {
                  onReply(c)
                  setShowReply(false)
                }}
              />
            </div>
          )}
          {comment.children && comment.children.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} depth={depth + 1} onReply={(c) => onReply(c)} userId={userId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CommentForm({ postId, userId, onSubmit }: { postId: string; userId?: string; onSubmit: (content: string) => void }) {
  const [value, setValue] = useState("")
  const [isSubmitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(value.trim())
      setValue("")
    } finally {
      setSubmitting(false)
    }
  }

  if (!userId) {
    return <p className="text-sm text-slate-500">댓글을 작성하려면 로그인이 필요합니다.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="댓글을 입력하세요"
        rows={2}
        className="text-sm"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting || !value.trim()}>
          {isSubmitting ? "등록 중..." : "댓글 등록"}
        </Button>
      </div>
    </form>
  )
}

// Helpers
function insertIntoTree(tree: CommentNode[], node: CommentNode): CommentNode[] {
  if (!node.parent_id) {
    return [...tree, { ...node, children: [] }]
  }
  return tree.map((item) => {
    if (item.id === node.parent_id) {
      return { ...item, children: [...(item.children || []), { ...node, children: [] }] }
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: insertIntoTree(item.children, node) }
    }
    return item
  })
}

function replaceTemp(tree: CommentNode[], tempId: string, saved: CommentNode): CommentNode[] {
  return tree.map((item) => {
    if (item.id === tempId) return { ...saved, children: item.children || [] }
    if (item.children && item.children.length > 0) {
      return { ...item, children: replaceTemp(item.children, tempId, saved) }
    }
    return item
  })
}

function removeNode(tree: CommentNode[], nodeId: string): CommentNode[] {
  return tree
    .filter((item) => item.id !== nodeId)
    .map((item) => (item.children ? { ...item, children: removeNode(item.children, nodeId) } : item))
}

