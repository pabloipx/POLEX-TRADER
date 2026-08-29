"use client"

import useSWR from "swr"
import { useState } from "react"
import { ArrowLeft, Bot, ShieldCheck, Unplug } from "lucide-react"

interface Connection {
  client_id: string
  scopes: string[]
  max_trade_amount: number
  daily_loss_limit: number
  allowed_symbols: string[]
  created_at: string
  oauth_clients: { name: string } | { name: string }[] | null
}

const fetcher = (url: string) => fetch(url).then(async (response) => {
  if (response.status === 401) {
    window.location.assign(`/auth/login?next=${encodeURIComponent("/connections")}`)
    return new Promise<never>(() => undefined)
  }
  if (!response.ok) throw new Error("Falha ao carregar")
  return response.json()
})

export default function ConnectionsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ connections: Connection[] }>("/api/oauth/connections", fetcher)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function revoke(clientId: string) {
    setRevoking(clientId)
    await fetch(`/api/oauth/connections?client_id=${encodeURIComponent(clientId)}`, { method: "DELETE" })
    await mutate()
    setRevoking(null)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 font-sans text-foreground sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center gap-4">
          <button type="button" onClick={() => history.back()} className="flex size-10 items-center justify-center rounded-xl border border-border bg-card" aria-label="Voltar"><ArrowLeft className="size-5" /></button>
          <div><h1 className="text-2xl font-bold text-balance">IAs conectadas</h1><p className="text-sm text-muted-foreground">Controle quais automações podem operar seu saldo real.</p></div>
        </header>

        <aside className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p>Nunca informe sua senha à IA. Autorize somente por esta tela, defina limites conservadores e revogue o acesso ao primeiro comportamento inesperado.</p></aside>

        {isLoading && <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Carregando conexões...</div>}
        {error && <div className="rounded-2xl border border-destructive/40 bg-card p-6 text-destructive">Não foi possível carregar suas conexões.</div>}
        {!isLoading && !error && data?.connections.length === 0 && <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center"><Bot className="size-8 text-primary" /><h2 className="font-semibold">Nenhuma IA conectada</h2><p className="max-w-md text-sm text-muted-foreground">Quando você autorizar o outro aplicativo via OAuth, ele aparecerá aqui com os limites permitidos.</p></div>}

        <div className="flex flex-col gap-4">
          {data?.connections.map((connection) => {
            const client = Array.isArray(connection.oauth_clients) ? connection.oauth_clients[0] : connection.oauth_clients
            return <article key={connection.client_id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10"><Bot className="size-5 text-primary" /></span><div><h2 className="font-semibold">{client?.name ?? connection.client_id}</h2><p className="font-mono text-xs text-muted-foreground">{connection.client_id}</p></div></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Ativa</span></div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-background p-3"><dt className="text-muted-foreground">Máximo por ordem</dt><dd className="mt-1 font-mono font-semibold">R$ {Number(connection.max_trade_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</dd></div><div className="rounded-xl bg-background p-3"><dt className="text-muted-foreground">Limite diário de perda</dt><dd className="mt-1 font-mono font-semibold">R$ {Number(connection.daily_loss_limit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</dd></div></dl>
              <p className="mt-3 text-xs text-muted-foreground">Ativos: {connection.allowed_symbols.length ? connection.allowed_symbols.join(", ") : "todos os ativos habilitados"}</p>
              <button type="button" onClick={() => revoke(connection.client_id)} disabled={revoking === connection.client_id} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"><Unplug className="size-4" />{revoking === connection.client_id ? "Revogando..." : "Revogar acesso imediatamente"}</button>
            </article>
          })}
        </div>
      </div>
    </main>
  )
}
