import { NextResponse } from "next/server"
import { authenticateAccessToken } from "@/lib/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

const MAX_LIMIT = 100

export async function GET(request: Request) {
  const token = await authenticateAccessToken(request, "trade:read")
  if (!token) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Token inválido, expirado ou sem a permissão trade:read." } },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer scope="trade:read"' } },
    )
  }

  const searchParams = new URL(request.url).searchParams
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "25", 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT) : 25
  const cursor = searchParams.get("cursor")
  const admin = createAdminClient()

  let requestQuery = admin
    .from("external_order_requests")
    .select("trade_id,created_at", { count: "exact" })
    .eq("user_id", token.user_id)
    .eq("client_id", token.client_id)
    .eq("status", "accepted")
    .not("trade_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (cursor) requestQuery = requestQuery.lt("created_at", cursor)
  const { data: requests, error: requestsError } = await requestQuery
  if (requestsError) {
    return NextResponse.json({ error: { code: "history_unavailable", message: "Não foi possível consultar o histórico." } }, { status: 500 })
  }

  const page = (requests ?? []).slice(0, limit)
  const tradeIds = page.map((item) => item.trade_id).filter((id): id is string => Boolean(id))
  if (tradeIds.length === 0) return NextResponse.json({ data: [], pagination: { nextCursor: null } })

  const { data: trades, error: tradesError } = await admin
    .from("trades")
    .select("id,symbol,direction,amount,entry_price,exit_price,timeframe,payout_percentage,result,profit,status,entry_time,expiry_time,exit_time,created_at")
    .eq("user_id", token.user_id)
    .in("id", tradeIds)

  if (tradesError) {
    return NextResponse.json({ error: { code: "history_unavailable", message: "Não foi possível consultar o histórico." } }, { status: 500 })
  }

  const byId = new Map((trades ?? []).map((trade) => [trade.id, trade]))
  const ordered = tradeIds.map((id) => byId.get(id)).filter(Boolean)
  const hasMore = (requests?.length ?? 0) > limit

  return NextResponse.json({
    data: ordered,
    pagination: { nextCursor: hasMore ? page.at(-1)?.created_at ?? null : null },
  })
}
