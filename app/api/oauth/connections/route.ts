import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("oauth_consents")
    .select("client_id,scopes,max_trade_amount,daily_loss_limit,allowed_symbols,active,created_at,oauth_clients(name)")
    .eq("user_id", user.id)
    .eq("active", true)
    .is("revoked_at", null)

  if (error) return NextResponse.json({ error: "Falha ao carregar conexões" }, { status: 500 })
  return NextResponse.json({ connections: data ?? [] })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const clientId = new URL(request.url).searchParams.get("client_id")
  if (!clientId) return NextResponse.json({ error: "client_id obrigatório" }, { status: 400 })

  const admin = createAdminClient()
  const revokedAt = new Date().toISOString()
  const { error } = await admin.from("oauth_consents").update({ active: false, revoked_at: revokedAt }).eq("user_id", user.id).eq("client_id", clientId)
  if (error) return NextResponse.json({ error: "Falha ao revogar conexão" }, { status: 500 })
  await admin.from("oauth_access_tokens").update({ revoked_at: revokedAt }).eq("user_id", user.id).eq("client_id", clientId).is("revoked_at", null)

  return NextResponse.json({ revoked: true })
}
