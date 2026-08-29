"use client"

import { useState } from "react"
import { Check, Clipboard, ExternalLink, KeyRound, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const permissions = [
  { scope: "trade:write", title: "Operar compra e venda", description: "Permite abrir ordens CALL (compra) e PUT (venda), sempre dentro dos limites definidos pelo usuário." },
  { scope: "balance:read", title: "Consultar saldo", description: "Permite ler somente o saldo real disponível e a moeda da conta." },
  { scope: "trade:read", title: "Ver histórico", description: "Permite consultar apenas as operações criadas por esta mesma IA." },
]

const quickConnectExample = `curl -X POST https://SUA_CORRETORA/api/oauth/connect \\
  -H "Content-Type: application/json" \\
  -d '{ "code": "COLE_A_CHAVE_PLX_CONNECT_AQUI" }'`

const authorizationExample = `GET /oauth/authorize?
  response_type=code&
  client_id=SEU_CLIENT_ID&
  redirect_uri=https%3A%2F%2Fseu-app.com%2Fcallback&
  scope=trade%3Awrite%20balance%3Aread%20trade%3Aread&
  state=VALOR_ALEATORIO&
  code_challenge=DESAFIO_PKCE&
  code_challenge_method=S256`

const tokenExample = `curl -X POST https://SUA_CORRETORA/api/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=SEU_CLIENT_ID" \\
  -d "code=CODIGO_RECEBIDO" \\
  -d "redirect_uri=https://seu-app.com/callback" \\
  -d "code_verifier=VERIFICADOR_PKCE"`

const orderExample = `curl -X POST https://SUA_CORRETORA/api/v1/orders \\
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "EURUSD_OTC",
    "direction": "CALL",
    "amount": 25,
    "timeframe": 60,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
  }'`

const balanceExample = `curl https://SUA_CORRETORA/api/v1/balance \\
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"`

const historyExample = `curl "https://SUA_CORRETORA/api/v1/trades?limit=25" \\
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"`

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">Exemplo</span>
        <Button type="button" variant="ghost" size="sm" onClick={copy} aria-label="Copiar exemplo">
          {copied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed"><code>{code}</code></pre>
    </div>
  )
}

export function ApiDocumentation() {
  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <ShieldCheck />
        <AlertTitle>OAuth 2.1 com PKCE</AlertTitle>
        <AlertDescription>A IA nunca recebe a senha do usuário. Cada permissão aparece no consentimento e pode ser revogada a qualquer momento.</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Recomendado para IAs</Badge>
          <CardTitle>Conexão rápida com uma chave</CardTitle>
          <CardDescription>O usuário gera a chave na aba IAs conectadas e cola na IA. Troque-a uma única vez no endpoint abaixo; a resposta contém access_token, client_id e api_base_url.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CodeBlock code={quickConnectExample} />
          <p className="text-sm leading-relaxed text-muted-foreground">A chave expira em 24 horas e não pode ser reutilizada. O access token emitido dura 30 dias, respeita o máximo definido de até R$ 1.000 por operação e pode ser revogado pelo usuário a qualquer momento.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo avançado: cadastre seu aplicativo</CardTitle>
          <CardDescription>Solicite ao administrador da corretora um Client ID e cadastre uma URL HTTPS exata para o retorno OAuth.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
            <KeyRound className="size-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed">Use o fluxo Authorization Code com PKCE S256. Tokens expiram em 15 minutos e devem permanecer somente no servidor da sua IA.</p>
          </div>
          <a className="inline-flex items-center gap-2 text-sm font-medium text-primary" href="/.well-known/oauth-authorization-server" target="_blank" rel="noreferrer">Ver metadados OAuth <ExternalLink className="size-4" /></a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Solicite as permissões</CardTitle><CardDescription>Inclua os três escopos abaixo no parâmetro scope, separados por espaço.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          {permissions.map((permission, index) => (
            <div key={permission.scope} className="flex flex-col gap-3">
              {index > 0 && <Separator />}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><h3 className="font-semibold">{permission.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{permission.description}</p></div>
                <Badge variant="secondary" className="font-mono">{permission.scope}</Badge>
              </div>
            </div>
          ))}
          <CodeBlock code={authorizationExample} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3. Troque o código por um token</CardTitle><CardDescription>Valide o state no callback e envie o code_verifier original ao endpoint de token.</CardDescription></CardHeader>
        <CardContent><CodeBlock code={tokenExample} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>4. Abra operações</CardTitle><CardDescription>Use direction CALL para compra e PUT para venda. Gere uma UUID exclusiva em idempotencyKey para cada nova ordem e impedir execuções duplicadas.</CardDescription></CardHeader>
        <CardContent><CodeBlock code={orderExample} /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>5. Consulte o saldo</CardTitle><CardDescription>Requer balance:read e retorna apenas o saldo real disponível.</CardDescription></CardHeader>
          <CardContent><CodeBlock code={balanceExample} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>6. Consulte o histórico</CardTitle><CardDescription>Requer trade:read. O cursor retornado permite buscar a próxima página.</CardDescription></CardHeader>
          <CardContent><CodeBlock code={historyExample} /></CardContent>
        </Card>
      </div>

      <Alert variant="destructive">
        <AlertTitle>Responsabilidade da integração</AlertTitle>
        <AlertDescription>Respeite limites de operação, trate respostas 401 e 429, nunca registre access tokens em logs e interrompa novas ordens quando a API devolver uma rejeição.</AlertDescription>
      </Alert>
    </div>
  )
}
