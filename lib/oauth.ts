import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/server"

export const ACCESS_TOKEN_TTL_SECONDS = 900
export const AUTH_CODE_TTL_SECONDS = 300
export const ALLOWED_SCOPES = new Set(["trade:write"])

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url")
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("base64url")
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function parseScopes(scope: string | null) {
  const scopes = [...new Set((scope || "").split(/\s+/).filter(Boolean))]
  return scopes.length > 0 && scopes.every((item) => ALLOWED_SCOPES.has(item)) ? scopes : null
}

export async function authenticateAccessToken(request: Request, requiredScope: string) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null

  const rawToken = authorization.slice(7).trim()
  if (!rawToken) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from("oauth_access_tokens")
    .select("client_id,user_id,scopes,expires_at,revoked_at")
    .eq("token_hash", sha256(rawToken))
    .maybeSingle()

  if (!data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) return null
  if (!Array.isArray(data.scopes) || !data.scopes.includes(requiredScope)) return null

  const { data: consent } = await admin
    .from("oauth_consents")
    .select("active,revoked_at")
    .eq("user_id", data.user_id)
    .eq("client_id", data.client_id)
    .maybeSingle()

  if (!consent?.active || consent.revoked_at) return null
  return data as { client_id: string; user_id: string; scopes: string[] }
}
