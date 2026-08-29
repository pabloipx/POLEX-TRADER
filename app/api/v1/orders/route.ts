import { NextResponse } from "next/server"
import { z } from "zod"
import { authenticateAccessToken } from "@/lib/oauth"
import { createAdminClient } from "@/lib/supabase/server"
import { getPriceManager } from "@/lib/price-engine/price-manager"
import { getRealPriceAt } from "@/lib/price-engine/real-quote"
import { isRealSymbol } from "@/lib/price-engine/real-price-store"
import { isTimeframeAllowed } from "@/lib/trading/timeframes"

const orderSchema = z.object({
  symbol: z.string().trim().min(3).max(30).transform((value) => value.toUpperCase()),
  direction: z.enum(["CALL", "PUT"]), amount: z.number().positive().max(100000),
  timeframe: z.number().int().positive().max(86400), idempotencyKey: z.string().uuid(),
})

const publicErrors: Record<string, [string, number]> = {
  CONSENT_REQUIRED: ["A autorização foi revogada ou não permite operações.", 403],
  RISK_LIMIT_EXCEEDED: ["A ordem ultrapassa o limite de risco autorizado.", 422],
  DAILY_LOSS_LIMIT_EXCEEDED: ["O limite diário de perda foi atingido.", 422],
  SYMBOL_NOT_ALLOWED: ["Ativo não autorizado pelo cliente.", 422],
  INSUFFICIENT_BALANCE: ["Saldo real insuficiente.", 422], ASSET_DISABLED: ["Ativo indisponível.", 422],
}

export async function POST(request: Request) {
  const identity = await authenticateAccessToken(request, "trade:write")
  if (!identity) return NextResponse.json({ error: { code: "invalid_token", message: "Token inválido, expirado ou revogado." } }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } })

  const parsed = orderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "invalid_request", message: "Ordem inválida.", fields: parsed.error.flatten().fieldErrors } }, { status: 400 })
  const order = parsed.data
  if (!isTimeframeAllowed(order.symbol, order.timeframe)) return NextResponse.json({ error: { code: "invalid_timeframe", message: "Tempo indisponível para o ativo." } }, { status: 422 })

  const now = Date.now()
  let entryPrice: number | null
  const admin = createAdminClient()
  if (isRealSymbol(order.symbol)) entryPrice = await getRealPriceAt(order.symbol, now)
  else {
    const { data: symbols } = await admin.from("otc_symbols").select("symbol,is_active,base_price,volatility").eq("is_active", true)
    if (!symbols?.length) return NextResponse.json({ error: { code: "quote_unavailable", message: "Cotação indisponível." } }, { status: 503 })
    const manager = getPriceManager()
    manager.initialize(symbols)
    entryPrice = manager.getPriceAt(order.symbol, now)
  }
  if (!entryPrice || entryPrice <= 0) return NextResponse.json({ error: { code: "quote_unavailable", message: "Cotação confiável indisponível." } }, { status: 503 })

  const { data, error } = await admin.rpc("execute_connected_trade", {
    p_user_id: identity.user_id, p_client_id: identity.client_id, p_symbol: order.symbol,
    p_direction: order.direction, p_amount: order.amount, p_timeframe: order.timeframe,
    p_entry_price: entryPrice, p_idempotency_key: order.idempotencyKey,
  })
  if (error) {
    const code = Object.keys(publicErrors).find((item) => error.message.includes(item))
    const [message, status] = code ? publicErrors[code] : ["Não foi possível executar a ordem.", 422]
    return NextResponse.json({ error: { code: code?.toLowerCase() || "order_rejected", message } }, { status })
  }
  return NextResponse.json({ data: { ...data, symbol: order.symbol, direction: order.direction, entryPrice } }, { status: data?.replayed ? 200 : 201 })
}
