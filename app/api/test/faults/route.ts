import { NextResponse } from "next/server"
import {
  authorizeFaultRequest,
  getFaults,
  resetFaults,
  setFault,
  type FaultMode,
  type FaultName,
} from "@/lib/testing/fault-injection"

export const dynamic = "force-dynamic"

const names = new Set<FaultName>(["quote", "database-before", "database-after"])
const modes = new Set<FaultMode>(["off", "error", "timeout"])

function forbidden() {
  return NextResponse.json({ error: "Indisponível." }, { status: 404 })
}

export async function GET(request: Request) {
  if (!authorizeFaultRequest(request)) return forbidden()
  return NextResponse.json({ faults: getFaults() })
}

export async function POST(request: Request) {
  if (!authorizeFaultRequest(request)) return forbidden()
  const body = await request.json().catch(() => null)
  if (body?.reset === true) {
    resetFaults()
    return NextResponse.json({ faults: getFaults() })
  }
  if (!names.has(body?.name) || !modes.has(body?.mode)) {
    return NextResponse.json({ error: "Falha ou modo inválido." }, { status: 400 })
  }
  setFault(body.name, body.mode)
  return NextResponse.json({ faults: getFaults() })
}
