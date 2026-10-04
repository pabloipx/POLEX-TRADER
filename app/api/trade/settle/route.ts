import { NextResponse } from "next/server"
import { multiAssetEngine } from "@/lib/price-engine/multi-asset-engine"
import { loadActiveManipulations } from "@/lib/price-engine/load-manipulations"
import { getRealPriceAt } from "@/lib/price-engine/real-quote"
import { isRealSymbol } from "@/lib/price-engine/real-price-store"
import { createClient } from "@/lib/supabase/server"
import { injectFault } from "@/lib/testing/fault-injection"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

    const { tradeId } = await request.json()
    if (typeof tradeId !== "string" || !tradeId) {
      return NextResponse.json({ error: "Operação inválida." }, { status: 400 })
    }

    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("id,symbol,expiry_time,result,is_demo")
      .eq("id", tradeId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (tradeError || !trade) return NextResponse.json({ error: "Operação não encontrada." }, { status: 404 })
    if (String(trade.result).toLowerCase() !== "pending") return NextResponse.json({ success: true, trade, replayed: true })
    if (trade.is_demo !== false) await injectFault("database-before")

    const expiryMs = new Date(trade.expiry_time).getTime()
    // O relógio do celular costuma estar um pouco adiantado: em vez de recusar e forçar outra
    // tentativa, espera a pequena diferença restante e liquida na mesma requisição.
    const remainingMs = expiryMs - Date.now()
    if (Number.isFinite(remainingMs) && remainingMs > 0 && remainingMs <= 3000) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs + 50))
    }
    if (!Number.isFinite(expiryMs) || Date.now() < expiryMs) {
      return NextResponse.json({ error: "A operação ainda não expirou." }, { status: 409 })
    }

    let exitPrice: number | null
    if (isRealSymbol(trade.symbol)) {
      exitPrice = await getRealPriceAt(trade.symbol, expiryMs)
    } else {
      const { data: otcSymbols, error: otcError } = await supabase
        .from("otc_symbols")
        .select("symbol,is_active,base_price,volatility")
        .eq("is_active", true)
      if (otcError || !otcSymbols?.length) {
        return NextResponse.json({ error: "Configuração OTC indisponível." }, { status: 503 })
      }
      // Mesma serie do grafico + manipulacao ativa carregada do banco: o preco de fechamento
      // reflete exatamente o candle que o usuario ve, inclusive quando ha manipulacao do admin.
      await loadActiveManipulations()
      exitPrice = multiAssetEngine.getPriceAt(trade.symbol, expiryMs)
    }

    if (!exitPrice || exitPrice <= 0) {
      return NextResponse.json({ error: "Cotação de fechamento indisponível. A operação continuará pendente." }, { status: 503 })
    }

    const { data, error } = await supabase.rpc("settle_trade_atomic", {
      p_trade_id: trade.id,
      p_exit_price: exitPrice,
    })

    if (error) {
      const status = error.message.includes("TRADE_NOT_EXPIRED") ? 409 : 400
      return NextResponse.json({ error: "Não foi possível liquidar a operação." }, { status })
    }

    if (trade.is_demo !== false) await injectFault("database-after")
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RESILIENCE_FAULT:")) {
      return NextResponse.json({ error: "Dependência temporariamente indisponível." }, { status: 503 })
    }
    console.error("[trade/settle] Falha ao liquidar operação:", error)
    return NextResponse.json({ error: "Erro interno ao liquidar a operação." }, { status: 500 })
  }
}
