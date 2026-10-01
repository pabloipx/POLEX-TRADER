// Sessao do painel restrito /adminsonar (somente Manipulacao).
// Cookie HttpOnly assinado com HMAC-SHA256; a senha nunca vai para o cliente
// e fica no codigo apenas como hash SHA-256.

import { cookies } from "next/headers"

export const SONAR_COOKIE = "sonar_session"

const SESSION_TTL_SECONDS = 60 * 60 * 8

const SONAR_EMAIL = "sonar@sonar.com"
const SONAR_PASSWORD_SHA256 = "879f975f4f6434225eb72ad32aa0c5eefdfa52e832d37753287d0e94c820a306"

const SEP = "|"

function getSecret(): string {
  return [
    "sonar-panel",
    process.env.ADMIN_SESSION_SECRET || "",
    process.env.SUPABASE_JWT_SECRET || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ].join(":")
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)))
}

export async function verifySonarCredentials(email: string, password: string): Promise<boolean> {
  const hash = toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)))
  const emailOk = safeEqual(email.trim().toLowerCase(), SONAR_EMAIL)
  const passOk = safeEqual(hash, SONAR_PASSWORD_SHA256)
  return emailOk && passOk
}

export async function createSonarSessionValue(): Promise<string> {
  const payload = `${SONAR_EMAIL}${SEP}${Date.now() + SESSION_TTL_SECONDS * 1000}`
  return `${payload}${SEP}${await sign(payload)}`
}

async function verifySonarSessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false
  const parts = value.split(SEP)
  if (parts.length !== 3) return false
  const [email, expiresAt, signature] = parts
  const expected = await sign(`${email}${SEP}${expiresAt}`)
  if (!safeEqual(signature, expected)) return false
  const expiry = Number(expiresAt)
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false
  return email === SONAR_EMAIL
}

export async function isSonarRequest(): Promise<boolean> {
  const store = await cookies()
  return verifySonarSessionValue(store.get(SONAR_COOKIE)?.value)
}

export function sonarCookieOptions(maxAge: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}
