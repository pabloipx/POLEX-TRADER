"use client"

import useSWR from "swr"
import { useState } from "react"
import { ArrowLeft, Bot, BookOpen, ShieldCheck, Unplug } from "lucide-react"
import { ApiDocumentation } from "@/components/connections/api-documentation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Connection {
  client_id: string
  scopes: string[]
  max_trade_amount: number
  daily_loss_limit: number
  allowed_symbols: string[]
  created_at: string
  oauth_clients: { name: string } | { name: string }[] | null
}

const scopeNames: Record<string, string> = {
  "trade:write": "Compra e venda",
  "balance:read": "Saldo",
  "trade:read": "Histórico desta IA",
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
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" onClick={() => history.back()} aria-label="Voltar"><ArrowLeft /></Button>
          <div><h1 className="text-balance text-2xl font-bold">Integrações de IA</h1><p className="text-sm text-muted-foreground">Gerencie acessos e consulte a documentação para conectar uma IA.</p></div>
        </header>

        <Tabs defaultValue="connections" className="gap-6">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="connections"><Bot /> IAs conectadas</TabsTrigger>
            <TabsTrigger value="documentation"><BookOpen /> Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="flex flex-col gap-6">
            <Alert><ShieldCheck /><AlertDescription>Nunca informe sua senha à IA. Autorize somente por OAuth, defina limites conservadores e revogue o acesso ao primeiro comportamento inesperado.</AlertDescription></Alert>

            {isLoading && <Card><CardContent className="p-6 text-muted-foreground">Carregando conexões...</CardContent></Card>}
            {error && <Card><CardContent className="p-6 text-destructive">Não foi possível carregar suas conexões.</CardContent></Card>}
            {!isLoading && !error && data?.connections.length === 0 && (
              <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><Bot className="size-8 text-primary" /><h2 className="font-semibold">Nenhuma IA conectada</h2><p className="max-w-md text-sm text-muted-foreground">Abra a aba Documentação para integrar um aplicativo. Quando o usuário autorizar o OAuth, a IA aparecerá aqui.</p></CardContent></Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {data?.connections.map((connection) => {
                const client = Array.isArray(connection.oauth_clients) ? connection.oauth_clients[0] : connection.oauth_clients
                return (
                  <Card key={connection.client_id}>
                    <CardHeader className="flex-row items-start justify-between gap-4">
                      <div><CardTitle>{client?.name ?? connection.client_id}</CardTitle><p className="mt-1 font-mono text-xs text-muted-foreground">{connection.client_id}</p></div>
                      <Badge>Ativa</Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-muted p-3"><dt className="text-muted-foreground">Máximo por ordem</dt><dd className="mt-1 font-mono font-semibold">R$ {Number(connection.max_trade_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</dd></div><div className="rounded-xl bg-muted p-3"><dt className="text-muted-foreground">Perda diária</dt><dd className="mt-1 font-mono font-semibold">R$ {Number(connection.daily_loss_limit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</dd></div></dl>
                      <div className="flex flex-wrap gap-2">{connection.scopes.map((scope) => <Badge key={scope} variant="secondary">{scopeNames[scope] ?? scope}</Badge>)}</div>
                      <p className="text-xs text-muted-foreground">Ativos: {connection.allowed_symbols.length ? connection.allowed_symbols.join(", ") : "todos os ativos habilitados"}</p>
                      <Button type="button" variant="destructive" onClick={() => revoke(connection.client_id)} disabled={revoking === connection.client_id}><Unplug data-icon="inline-start" />{revoking === connection.client_id ? "Revogando..." : "Revogar acesso imediatamente"}</Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="documentation"><ApiDocumentation /></TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
