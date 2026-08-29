import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { randomToken, sha256 } from "@/lib/oauth"
import { createAdminClient } from "@/lib/supabase/server"

const exchangeSchema = z.object({ code: z.string().startsWith("plx_connect_").max(128) })
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

function errorResponse(description: string, status = 400) {
  return NextResponse.json({ error: "invalid_connection_code", error_description: description }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const parsed = exchangeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse("Código de conexão inválido.")

  const admin = createAdminClient()
  const { data: consumed, error: consumeError } = await admin.rpc("consume_oauth_connection_code", {
    p_code_hash: sha256(parsed.data.code),
  })
  const connection = Array.isArray(consumed) ? consumed[0] : consumed
  if (consumeError || !connection?.id) return errorResponse("Código inválido, expirado ou já utilizado.")

  const clientId = `ai_${randomUUID().replaceAll("-", "")}`
  const accessToken = randomToken(48)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString()

  const { error: clientError } = await admin.from("oauth_clients").insert({
    client_id: clientId,
    client_secret_hash: sha256(randomToken(32)),
    name: connection.client_name,
    redirect_uris: [],
  })
  if (clientError) return errorResponse("Não foi possível criar a conexão.", 500)

  const { error: consentError } = await admin.from("oauth_consents").insert({
    user_id: connection.user_id,
    client_id: clientId,
    scopes: connection.scopes,
    max_trade_amount: connection.max_trade_amount,
    daily_loss_limit: connection.daily_loss_limit,
    allowed_symbols: connection.allowed_symbols,
  })
  if (consentError) return errorResponse("Não foi possível autorizar a conexão.", 500)

  const { error: tokenError } = await admin.from("oauth_access_tokens").insert({
    token_hash: sha256(accessToken),
    client_id: clientId,
    user_id: connection.user_id,
    scopes: connection.scopes,
    expires_at: expiresAt,
  })
  if (tokenError) return errorResponse("Não foi possível emitir a credencial.", 500)

  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: TOKEN_TTL_SECONDS,
    scope: connection.scopes.join(" "),
    client_id: clientId,
    api_base_url: new URL("/api/v1", request.url).toString(),
  }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } })
}
