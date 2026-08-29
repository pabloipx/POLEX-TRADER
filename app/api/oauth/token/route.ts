import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { ACCESS_TOKEN_TTL_SECONDS, randomToken, safeEqual, sha256 } from "@/lib/oauth"

const tokenSchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string().min(32).max(512),
  client_id: z.string().min(8).max(128),
  redirect_uri: z.string().url().max(2048),
  code_verifier: z.string().min(43).max(128),
})

function oauthError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || ""
  const raw = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries())
  const parsed = tokenSchema.safeParse(raw)
  if (!parsed.success) return oauthError("invalid_request", "Parâmetros OAuth inválidos.")

  const admin = createAdminClient()
  const codeHash = sha256(parsed.data.code)
  const { data: authorizationCode } = await admin
    .from("oauth_authorization_codes")
    .select("client_id,user_id,redirect_uri,scopes,code_challenge,expires_at,used_at")
    .eq("code_hash", codeHash)
    .maybeSingle()

  if (!authorizationCode || authorizationCode.used_at || new Date(authorizationCode.expires_at).getTime() <= Date.now()) {
    return oauthError("invalid_grant", "Código inválido ou expirado.")
  }
  if (authorizationCode.client_id !== parsed.data.client_id || authorizationCode.redirect_uri !== parsed.data.redirect_uri) {
    return oauthError("invalid_grant", "O código não pertence a este cliente.")
  }
  if (!safeEqual(sha256(parsed.data.code_verifier), authorizationCode.code_challenge)) {
    return oauthError("invalid_grant", "Verificação PKCE inválida.")
  }

  const usedAt = new Date().toISOString()
  const { data: consumed } = await admin
    .from("oauth_authorization_codes")
    .update({ used_at: usedAt })
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .select("code_hash")
    .maybeSingle()
  if (!consumed) return oauthError("invalid_grant", "Código já utilizado.")

  const accessToken = randomToken(48)
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString()
  const { error } = await admin.from("oauth_access_tokens").insert({
    token_hash: sha256(accessToken), client_id: authorizationCode.client_id,
    user_id: authorizationCode.user_id, scopes: authorizationCode.scopes, expires_at: expiresAt,
  })
  if (error) return oauthError("server_error", "Não foi possível emitir o token.", 500)

  return NextResponse.json({
    access_token: accessToken, token_type: "Bearer", expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: authorizationCode.scopes.join(" "),
  }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } })
}
