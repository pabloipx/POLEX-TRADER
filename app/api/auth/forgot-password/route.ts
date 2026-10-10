import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Implicit flow puts the recovery session in the link itself, so the e-mail works
// even when opened in a different browser/app than the one that requested it
// (PKCE would require the code verifier stored in the original browser).
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (error.status === 429 || msg.includes("rate limit") || msg.includes("too many") || msg.includes("security purposes")) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 })
    }
    console.error("[forgot-password] resetPasswordForEmail failed:", error.message)
    return NextResponse.json({ error: "Não foi possível enviar o e-mail agora. Tente novamente." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
