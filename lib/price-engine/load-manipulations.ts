import { createClient } from "@supabase/supabase-js"
import { setManipulations, type Manipulation } from "./multi-asset-engine"

/**
 * Carrega as manipulacoes ativas do banco e injeta no motor de precos ANTES de calcular
 * o preco de entrada/liquidacao no servidor.
 *
 * Necessario porque `setManipulations` e um estado de modulo: no cliente ele e alimentado
 * pelo poller (`ensureManipulationSync`), mas em cada invocacao serverless a memoria e fria.
 * Sem esta carga o preco no servidor ignoraria a manipulacao e o resultado (WIN/LOSS) nao
 * seguiria o candle manipulado que o usuario ve no grafico.
 *
 * Mesma consulta do endpoint publico /api/global/manipulations: TODAS as manipulacoes com
 * active = true (inclusive as ja terminadas, cujo deslocamento fica congelado no nivel final).
 */
export async function loadActiveManipulations(): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      setManipulations([])
      return
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase
      .from("otc_manipulations")
      .select("symbol, direction, start_time, end_time, strength, style")
      .eq("active", true)
      .order("start_time", { ascending: false })
      .limit(200)

    if (error || !data) {
      setManipulations([])
      return
    }

    const manipulations: Manipulation[] = data.map((m: any) => ({
      symbol: m.symbol,
      direction: m.direction,
      startTime: Math.floor(new Date(m.start_time).getTime() / 1000),
      endTime: Math.floor(new Date(m.end_time).getTime() / 1000),
      strength: Number(m.strength) || 60,
      style: m.style || "natural",
    }))

    setManipulations(manipulations)
  } catch {
    setManipulations([])
  }
}
