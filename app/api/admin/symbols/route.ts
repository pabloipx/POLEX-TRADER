import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminRequest } from "@/lib/admin/session"

async function verifyAdmin() {
  return { isAdmin: await isAdminRequest(), adminClient: createAdminClient() }
}

export async function GET(request: Request) {
  try {
    const { isAdmin, adminClient } = await verifyAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: symbols, error } = await adminClient.from("otc_symbols").select("*").order("symbol")

    if (error) throw error

    return NextResponse.json({ symbols: symbols || [] })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { isAdmin, adminClient } = await verifyAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, volatility, is_active, payout_percentage, base_price } = body

    if (!id) {
      return NextResponse.json({ error: "Symbol ID required" }, { status: 400 })
    }

    const updateData: any = {}
    if (volatility !== undefined) updateData.volatility = Number(volatility)
    if (is_active !== undefined) updateData.is_active = is_active
    if (payout_percentage !== undefined) updateData.payout_percentage = Math.round(Number(payout_percentage))
    if (base_price !== undefined) updateData.base_price = Number(base_price)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    const { data, error } = await adminClient.from("otc_symbols").update(updateData).eq("id", id).select().single()

    if (error) throw error

    // mantem asset_settings sincronizado com o ativo
    if (data?.symbol) {
      await adminClient.from("asset_settings").upsert(
        {
          symbol: data.symbol,
          enabled: data.is_active,
          payout: data.payout_percentage,
        },
        { onConflict: "symbol" },
      )
    }

    return NextResponse.json({ success: true, symbol: data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
