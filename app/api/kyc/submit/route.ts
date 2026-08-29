import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

function isOwnedKycPath(path: unknown, userId: string, type: "front" | "back" | "selfie") {
  return typeof path === "string" && path.startsWith(`${userId}/${type}_`) && !path.includes("..")
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

    const { documentFrontPath, documentBackPath, selfiePath } = await request.json()
    if (
      !isOwnedKycPath(documentFrontPath, user.id, "front") ||
      !isOwnedKycPath(documentBackPath, user.id, "back") ||
      !isOwnedKycPath(selfiePath, user.id, "selfie")
    ) {
      return NextResponse.json({ error: "Documentos KYC inválidos." }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const paths = [documentFrontPath, documentBackPath, selfiePath]
    const checks = await Promise.all(
      paths.map((path) => supabaseAdmin.storage.from("kyc-documents").list(user.id, { search: path.split("/")[1] })),
    )

    if (checks.some(({ data, error }, index) => error || !data?.some((file) => `${user.id}/${file.name}` === paths[index]))) {
      return NextResponse.json({ error: "Um ou mais documentos não foram encontrados." }, { status: 400 })
    }

    const { error: kycError } = await supabaseAdmin.from("kyc_requests").insert({
      user_id: user.id,
      document_front_url: documentFrontPath,
      document_back_url: documentBackPath,
      selfie_with_document_url: selfiePath,
      status: "pending",
    })

    if (kycError) {
      console.error("KYC request creation failed:", kycError.message)
      return NextResponse.json({ error: "Não foi possível enviar a verificação." }, { status: 500 })
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ kyc_status: "pending" })
      .eq("id", user.id)

    if (profileError) {
      console.error("KYC profile update failed:", profileError.message)
      return NextResponse.json({ error: "A solicitação foi recebida, mas o status não pôde ser atualizado." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("KYC submission failed:", error)
    return NextResponse.json({ error: "Erro inesperado ao enviar a verificação." }, { status: 500 })
  }
}
