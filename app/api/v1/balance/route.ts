import { NextResponse } from "next/server"
import { authenticateAccessToken } from "@/lib/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const token = await authenticateAccessToken(request, "balance:read")
  if (!token) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Token inválido, expirado ou sem a permissão balance:read." } },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer scope="balance:read"' } },
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_balances")
    .select("balance_real,currency,updated_at")
    .eq("user_id", token.user_id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: { code: "balance_unavailable", message: "Não foi possível consultar o saldo." } }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      available: Number(data?.balance_real ?? 0),
      currency: data?.currency ?? "BRL",
      updatedAt: data?.updated_at ?? null,
    },
  })
}
