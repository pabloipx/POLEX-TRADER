type FaultName = "quote" | "database-before" | "database-after"
type FaultMode = "off" | "error" | "timeout"

type FaultState = Record<FaultName, FaultMode>

const cleanState = (): FaultState => ({
  quote: "off",
  "database-before": "off",
  "database-after": "off",
})

const globalFaults = globalThis as typeof globalThis & { __resilienceFaults?: FaultState }

export function faultsEnabled() {
  return process.env.NODE_ENV !== "production" && Boolean(process.env.ADMIN_SESSION_SECRET)
}

export function authorizeFaultRequest(request: Request) {
  const key = request.headers.get("x-resilience-key")
  return faultsEnabled() && key === process.env.ADMIN_SESSION_SECRET
}

export function getFaults(): FaultState {
  if (!globalFaults.__resilienceFaults) globalFaults.__resilienceFaults = cleanState()
  return { ...globalFaults.__resilienceFaults }
}

export function setFault(name: FaultName, mode: FaultMode) {
  if (!faultsEnabled()) throw new Error("FAULT_INJECTION_DISABLED")
  if (!globalFaults.__resilienceFaults) globalFaults.__resilienceFaults = cleanState()
  globalFaults.__resilienceFaults[name] = mode
}

export function resetFaults() {
  globalFaults.__resilienceFaults = cleanState()
}

export async function injectFault(name: FaultName) {
  if (!faultsEnabled()) return
  const mode = getFaults()[name]
  if (mode === "off") return
  if (mode === "timeout") await new Promise((resolve) => setTimeout(resolve, 2_500))
  throw new Error(`RESILIENCE_FAULT:${name}:${mode}`)
}

export type { FaultMode, FaultName }
