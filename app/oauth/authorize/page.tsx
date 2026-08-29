import { redirect } from "next/navigation"
import { ShieldCheck, Bot, TriangleAlert } from "lucide-react"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { parseScopes } from "@/lib/oauth"

export default async function OAuthAuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const clientId = typeof params.client_id === "string" ? params.client_id : ""
  const redirectUri = typeof params.redirect_uri === "string" ? params.redirect_uri : ""
  const state = typeof params.state === "string" ? params.state : ""
  const scope = typeof params.scope === "string" ? params.scope : ""
  const challenge = typeof params.code_challenge === "string" ? params.code_challenge : ""
  const method = params.code_challenge_method

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const returnTo = `/oauth/authorize?${new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, state, scope, code_challenge: challenge, code_challenge_method: "S256" })}`
    redirect(`/auth/login?next=${encodeURIComponent(returnTo)}`)
  }

  const scopes = parseScopes(scope)
  const admin = createAdminClient()
  const { data: client } = await admin.from("oauth_clients").select("name,redirect_uris,active").eq("client_id", clientId).maybeSingle()
  const valid = Boolean(client?.active && client.redirect_uris.includes(redirectUri) && state.length >= 8 && challenge.length >= 43 && method === "S256" && scopes)

  if (!valid) return <main className="flex min-h-screen items-center justify-center bg-[#07110c] p-6 text-white"><div className="max-w-md rounded-2xl border border-red-500/30 bg-[#0d1912] p-8"><TriangleAlert className="size-8 text-red-400"/><h1 className="mt-4 text-2xl font-bold">Solicitação inválida</h1><p className="mt-2 text-sm text-white/60">O aplicativo ou endereço de retorno não foi reconhecido.</p></div></main>

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110c] p-5 text-white">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0d1912] shadow-2xl">
        <div className="border-b border-white/10 p-7"><div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/10"><Bot className="size-6 text-emerald-400"/></span><div><p className="text-sm text-white/50">Conectar aplicativo</p><h1 className="text-2xl font-bold">{client!.name}</h1></div></div></div>
        <form action="/api/oauth/authorize" method="post" className="flex flex-col gap-6 p-7">
          {Object.entries({ client_id: clientId, redirect_uri: redirectUri, state, scope, code_challenge: challenge, code_challenge_method: "S256" }).map(([name,value]) => <input key={name} type="hidden" name={name} value={value}/>) }
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="flex items-center gap-2 font-semibold text-amber-200"><TriangleAlert className="size-5"/>Operações com saldo real</p><p className="mt-2 text-sm leading-6 text-white/65">Este aplicativo poderá abrir operações automaticamente. Lucros não são garantidos e você pode perder o valor investido.</p></div>
          <div><label htmlFor="max_trade_amount" className="text-sm font-medium">Limite por operação (R$)</label><input id="max_trade_amount" name="max_trade_amount" type="number" min="1" max="100000" step="0.01" required defaultValue="50" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-emerald-400"/></div>
          <div><label htmlFor="daily_loss_limit" className="text-sm font-medium">Limite de perda diária (R$)</label><input id="daily_loss_limit" name="daily_loss_limit" type="number" min="1" max="1000000" step="0.01" required defaultValue="200" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-emerald-400"/></div>
          <div><label htmlFor="allowed_symbols" className="text-sm font-medium">Ativos permitidos</label><input id="allowed_symbols" name="allowed_symbols" placeholder="EURUSD, BTCUSD" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-emerald-400"/><p className="mt-2 text-xs text-white/45">Separe por vírgulas. Em branco permite todos os ativos habilitados.</p></div>
          <div className="flex items-start gap-3 text-sm text-white/65"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-400"/><p>Você poderá revogar o acesso. A IA nunca recebe sua senha da corretora.</p></div>
          <div className="grid grid-cols-2 gap-3"><button name="decision" value="deny" className="rounded-xl border border-white/15 px-4 py-3 font-semibold">Cancelar</button><button name="decision" value="allow" className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#07110c]">Autorizar IA</button></div>
        </form>
      </section>
    </main>
  )
}
