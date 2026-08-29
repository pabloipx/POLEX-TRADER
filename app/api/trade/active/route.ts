import { NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ activeTrade: null })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: trade, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .ilike("result", "pending")
      .order("entry_time", { ascending: true })

    if (error || !trade) {
      return NextResponse.json({ activeTrades: [] })
    }

    return NextResponse.json({ activeTrades: trade, activeTrade: trade[0] ?? null })
  } catch {
    return NextResponse.json({ activeTrade: null })
  }
}
