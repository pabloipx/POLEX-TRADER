"use client"

import { useState } from "react"
import { Check, Copy, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GeneratedCode { code: string; expiresAt: string }

export function QuickConnect() {
  const [clientName, setClientName] = useState("")
  const [maxTradeAmount, setMaxTradeAmount] = useState("50")
  const [dailyLossLimit, setDailyLossLimit] = useState("200")
  const [symbols, setSymbols] = useState("")
  const [generated, setGenerated] = useState<GeneratedCode | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  async function generate() {
    setLoading(true)
    setError("")
    setGenerated(null)
    const response = await fetch("/api/oauth/connection-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        maxTradeAmount,
        dailyLossLimit,
        allowedSymbols: symbols.split(",").map((value) => value.trim()).filter(Boolean),
      }),
    })
    const result = await response.json()
    if (!response.ok) setError(result.error ?? "Não foi possível gerar o código.")
    else setGenerated(result)
    setLoading(false)
  }

  async function copyCode() {
    if (!generated) return
    await navigator.clipboard.writeText(generated.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Badge variant="secondary"><KeyRound /> Conexão rápida</Badge>
          <Badge variant="outline">Uso único · 10 min</Badge>
        </div>
        <CardTitle className="text-balance text-xl">Gere uma chave para conectar sua IA</CardTitle>
        <CardDescription>Defina os limites, copie a chave e cole na IA. Ela poderá trocar a chave uma única vez por um acesso revogável.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor="ai-name">Nome da IA</Label><Input id="ai-name" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ex.: Assistente de Trading" maxLength={80} /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="max-trade">Máximo por operação (R$)</Label><Input id="max-trade" type="number" min="1" step="0.01" value={maxTradeAmount} onChange={(event) => setMaxTradeAmount(event.target.value)} /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="daily-loss">Limite de perda diária (R$)</Label><Input id="daily-loss" type="number" min="1" step="0.01" value={dailyLossLimit} onChange={(event) => setDailyLossLimit(event.target.value)} /></div>
          <div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor="symbols">Ativos permitidos</Label><Input id="symbols" value={symbols} onChange={(event) => setSymbols(event.target.value)} placeholder="EURUSD_OTC, BTCUSD (vazio permite todos)" /><p className="text-xs leading-relaxed text-muted-foreground">Separe os ativos por vírgula. Deixe vazio somente se quiser permitir todos os ativos habilitados.</p></div>
        </div>

        <div className="flex flex-wrap gap-2"><Badge variant="secondary">Compra e venda</Badge><Badge variant="secondary">Consultar saldo</Badge><Badge variant="secondary">Histórico desta IA</Badge></div>
        <Button type="button" onClick={generate} disabled={loading || clientName.trim().length < 2}>
          {loading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
          {loading ? "Gerando..." : "Gerar chave de conexão"}
        </Button>

        {error && <Alert variant="destructive"><AlertTitle>Não foi possível gerar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {generated && (
          <Alert>
            <KeyRound />
            <AlertTitle>Chave pronta para copiar</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <code className="break-all rounded-md bg-muted p-3 font-mono text-xs text-foreground">{generated.code}</code>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>Expira às {new Date(generated.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} e desaparece após o primeiro uso.</span>
                <Button type="button" size="sm" variant="outline" onClick={copyCode}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? "Copiada" : "Copiar chave"}</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
