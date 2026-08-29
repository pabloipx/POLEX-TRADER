import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
const ALLOWED_DOCUMENT_TYPES = new Set(["front", "back", "selfie"])
const MAX_FILE_SIZE = 10 * 1024 * 1024

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Sessão inválida. Entre novamente." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const type = formData.get("type")

    if (!(file instanceof File) || typeof type !== "string" || !ALLOWED_DOCUMENT_TYPES.has(type)) {
      return NextResponse.json({ error: "Dados do documento inválidos." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formato não permitido. Envie JPEG, PNG, WebP ou PDF." }, { status: 415 })
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 10 MB." }, { status: 413 })
    }

    const fileName = `${user.id}/${type}_${crypto.randomUUID()}.${extensionByType[file.type]}`
    const buffer = new Uint8Array(await file.arrayBuffer())
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.storage.from("kyc-documents").upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("KYC storage upload failed:", error.message)
      return NextResponse.json({ error: "Não foi possível enviar o documento." }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: data.path })
  } catch (error) {
    console.error("KYC upload failed:", error)
    return NextResponse.json({ error: "Erro inesperado ao enviar o documento." }, { status: 500 })
  }
}
