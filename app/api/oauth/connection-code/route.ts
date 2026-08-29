import { NextResponse } from "next/server"
import { z } from "zod"
import { randomToken, sha256 } from "@/lib/oauth"
import { createAdminClient, createClient } from "@/lib/supabase/server"

const inputSchema = z.object({
  clientName: z.string().trim().min(2).max(80),
  maxTradeAmount: z.coerce.number().positive().max(1_000),
  allowedSymbols: z.array(z.string().trim().min(1).max(32)).max(50),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Revise o nome e informe um máximo de até R$ 1.000 por operação." }, { status: 400 })

  const rawCode = `plx_connect_${randomToken(32)}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const admin = createAdminClient()
  const { error } = await admin.from("oauth_connection_codes").insert({
    user_id: user.id,
    code_hash: sha256(rawCode),
    client_name: parsed.data.clientName,
    scopes: ["trade:write", "balance:read", "trade:read"],
    max_trade_amount: parsed.data.maxTradeAmount,
    daily_loss_limit: null,
    allowed_symbols: [...new Set(parsed.data.allowedSymbols.map((symbol) => symbol.toUpperCase()))],
    expires_at: expiresAt,
  })

  if (error) return NextResponse.json({ error: "Não foi possível gerar o código." }, { status: 500 })
  return NextResponse.json({ code: rawCode, expiresAt }, { status: 201, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } })
}
