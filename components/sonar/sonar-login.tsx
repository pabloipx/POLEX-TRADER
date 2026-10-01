"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SonarLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/adminsonar/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Falha no login")
        return
      }
      router.refresh()
    } catch {
      setError("Erro de conexao")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/15">
            <Zap className="size-6 text-orange-500" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Painel Sonar</h1>
          <p className="text-sm text-muted-foreground">Entre para acessar a manipulacao</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="sonar-email" className="text-sm font-medium text-muted-foreground">
              E-mail
            </label>
            <input
              id="sonar-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sonar-password" className="text-sm font-medium text-muted-foreground">
              Senha
            </label>
            <input
              id="sonar-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-orange-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-orange-500 text-base font-semibold text-white hover:bg-orange-600"
          >
            {loading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  )
}
