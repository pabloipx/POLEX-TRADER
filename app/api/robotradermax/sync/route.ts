import { NextResponse } from "next/server"
import { createClient as createSessionClient, createAdminClient } from "@/lib/supabase/server"
import { createClient as createStatelessClient } from "@supabase/supabase-js"

// Depósito mínimo (aprovado) exigido para liberar o Robo Trader Max.
const MIN_DEPOSIT = 200

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json({ error: "Informe o e-mail e a senha da corretora." }, { status: 400 })
    }

    // 1. Precisa estar logado na corretora (sessão ativa).
    const supabase = await createSessionClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Sessão expirada. Entre na corretora novamente." }, { status: 401 })
    }

    // 2. As credenciais informadas precisam ser da própria conta logada.
    if ((user.email || "").trim().toLowerCase() !== email) {
      return NextResponse.json(
        { error: "As credenciais precisam ser da conta que está logada na corretora." },
        { status: 403 },
      )
    }

    // 3. Verifica a senha sem afetar a sessão (cliente isolado, sem persistência).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const verifier = createStatelessClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: signIn, error: signInError } = await verifier.auth.signInWithPassword({ email, password })
    await verifier.auth.signOut().catch(() => {})

    if (signInError || !signIn?.user || signIn.user.id !== user.id) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 })
    }

    // 4. Precisa ter depositado pelo menos MIN_DEPOSIT (soma de depósitos aprovados).
    const admin = createAdminClient()
    const { data: depositsData, error: depositsError } = await admin
      .from("deposits")
      .select("amount, status")
      .eq("user_id", user.id)
      .in("status", ["approved", "completed"])

    if (depositsError) {
      return NextResponse.json({ error: "Não foi possível verificar seus depósitos." }, { status: 500 })
    }

    const totalDeposited = (depositsData || []).reduce((sum, d) => sum + Number(d.amount || 0), 0)

    if (totalDeposited < MIN_DEPOSIT) {
      return NextResponse.json(
        {
          error: "deposit_required",
          minDeposit: MIN_DEPOSIT,
          totalDeposited,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({ ok: true, totalDeposited })
  } catch {
    return NextResponse.json({ error: "Erro ao sincronizar a conta." }, { status: 500 })
  }
}
