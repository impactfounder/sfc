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
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
