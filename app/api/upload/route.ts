import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // BLOB_READ_WRITE_TOKEN 환경변수 확인
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN is missing")
      return NextResponse.json(
        { error: "서버 설정 오류: BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다." }, { status: 400 })
    }

    // 파일 타입 검증 (이미지 또는 PDF)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "application/pdf"
    ]
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"]
    
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
    
    if (!isValidType) {
      return NextResponse.json({ 
        error: "JPG, JPEG, PNG, PDF 파일만 업로드 가능합니다." 
      }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "파일 크기는 10MB를 초과할 수 없습니다." }, { status: 400 })
    }

    // Upload to Vercel Blob
    // addRandomSuffix를 사용하여 고유한 파일명 생성 (같은 이름의 파일이 있어도 덮어쓰기 방지)
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
    return NextResponse.json(
      { error: `업로드 실패: ${errorMessage}` },
      { status: 500 }
    )
  }
}
