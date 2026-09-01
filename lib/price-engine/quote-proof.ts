import { createHmac, timingSafeEqual } from "node:crypto"

const MAX_QUOTE_AGE_MS = 15_000

type QuotePayload = {
  symbol: string
  price: number
  timestamp: number
}

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_JWT_SECRET
  if (!value) throw new Error("Quote signing secret is unavailable")
  return value
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function createQuoteProof(symbol: string, price: number): string {
  const payload = Buffer.from(JSON.stringify({ symbol, price, timestamp: Date.now() } satisfies QuotePayload)).toString("base64url")
  return `${payload}.${signature(payload)}`
}

export function verifyQuoteProof(token: unknown, expectedSymbol: string): QuotePayload | null {
  if (typeof token !== "string") return null
  const [payload, providedSignature, ...rest] = token.split(".")
  if (!payload || !providedSignature || rest.length) return null

  const expectedSignature = signature(payload)
  const provided = Buffer.from(providedSignature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as QuotePayload
    if (
      parsed.symbol !== expectedSymbol ||
      !Number.isFinite(parsed.price) ||
      parsed.price <= 0 ||
      !Number.isFinite(parsed.timestamp) ||
      Date.now() - parsed.timestamp < 0 ||
      Date.now() - parsed.timestamp > MAX_QUOTE_AGE_MS
    ) return null
    return parsed
  } catch {
    return null
  }
}
