"use client"

import type React from "react"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, ImageIcon, Loader2, Heading1, Heading2, Quote, Code, Minus } from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-[80%] max-h-[500px] object-contain mx-auto my-4",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate prose-base max-w-none focus:outline-none min-h-[400px] px-4 py-3 text-[15px] leading-normal text-slate-900",
      },
    },
    immediatelyRender: false,
  })

  // 외부에서 content가 변경되면(예: DB 로딩 완료 시) 에디터에 반영
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      // 무한 루프 방지를 위해 내용이 다를 때만 업데이트
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `업로드 실패 (상태 코드: ${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      editor.chain().focus().setImage({ src: data.url }).run()
    } catch (error) {
      console.error("이미지 업로드 에러:", error)
      const errorMessage = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다."
      alert(`이미지 업로드 실패: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 min-h-[400px]">
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 flex-wrap">
        {/* 제목 1 */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive("heading", { level: 1 }) ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="제목 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        {/* 제목 2 */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive("heading", { level: 2 }) ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="제목 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-slate-300 mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBold().run()
          }}
          className={`h-8 w-8 p-0 ${editor.isActive("bold") ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="굵게"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleItalic().run()
          }}
          className={`h-8 w-8 p-0 ${editor.isActive("italic") ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="기울임"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-slate-300 mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBulletList().run()
          }}
          className={`h-8 w-8 p-0 ${editor.isActive("bulletList") ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="글머리 기호"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleOrderedList().run()
          }}
          className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="번호 매기기"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        {/* 인용구 */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("blockquote") ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="인용구"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* 코드블럭 */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("codeBlock") ? "bg-slate-200 text-slate-900" : "text-slate-500"}`}
          title="코드 블럭"
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* 구분선 */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
          title="구분선"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault()
            fileInputRef.current?.click()
          }}
          disabled={isUploading}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
          title="이미지 업로드"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
