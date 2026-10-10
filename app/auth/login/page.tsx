"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { needsMfaCode, verifyMfaCode } from "@/lib/supabase/mfa"
import { recordDeviceSession } from "@/lib/device-session"

function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <Image
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      width={24}
      height={18}
      className={className}
      unoptimized
    />
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const router = useRouter()

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    if (mfaCode.length !== 6) {
      setError("Digite o código de 6 dígitos")
      return
    }
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const mfaError = await verifyMfaCode(supabase, mfaCode)
    if (mfaError) {
      setError(mfaError)
      setMfaCode("")
      setIsLoading(false)
      return
    }
    await recordDeviceSession()
    router.replace("/trade")
  }

  const cancelMfa = async () => {
    await createClient().auth.signOut()
    setMfaStep(false)
    setMfaCode("")
    setPassword("")
    setError(null)
  }

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      if (data.session && (await needsMfaCode(supabase))) {
        setMfaStep(true)
        setIsCheckingSession(false)
      } else if (data.session) {
        router.replace("/trade")
      } else {
        setIsCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError("Preencha todos os campos")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (signInError) {
        const msg = signInError.message.toLowerCase()
        if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
          throw new Error("E-mail ou senha incorretos")
        }
        if (msg.includes("email not confirmed")) {
          throw new Error("Confirme seu e-mail antes de entrar")
        }
        if (msg.includes("too many requests")) {
          throw new Error("Muitas tentativas. Aguarde alguns minutos.")
        }
        throw new Error(signInError.message)
      }

      if (await needsMfaCode(supabase)) {
        setMfaStep(true)
        setIsLoading(false)
        return
      }

      // Registra este dispositivo/navegador para a tela "Dispositivos conectados".
      await recordDeviceSession()

      router.push("/trade")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login"
      setError(message)
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#07090d]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    )
  }

  const inputClass =
    "h-[72px] w-full rounded-md border border-[#a5a5a5] bg-[#ffffff] px-6 text-lg text-[#343434] outline-none transition-colors placeholder:text-[#8a8a8a] focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] disabled:opacity-50"

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#ffffff] font-sans text-[#343434]">
      <header className="flex h-20 items-center justify-between border-b border-[#eeeeee] bg-[#fbfafb] px-5 md:h-24 md:px-8">
        <Link href="/" className="flex items-center" aria-label="Fidex Option — início">
          <Image src="/images/fidelity-auth-logo.png" alt="Fidex Option" width={883} height={245} className="h-14 w-auto object-contain md:h-16" unoptimized />
        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2 text-base font-medium text-[#343434]">
            <Flag code="BR" className="h-6 w-6 rounded-full object-cover" />
            PT
          </div>
          <Link href="/auth/sign-up" className="flex h-12 items-center rounded-sm bg-[#22c55e] px-5 text-base font-medium text-[#ffffff] hover:bg-[#16a34a] md:h-14 md:px-7">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 py-14 md:py-20">
        <section className="flex w-full max-w-[640px] flex-col items-center">
          {mfaStep ? (
            <>
              <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10">
                <ShieldCheck className="h-8 w-8 text-[#22c55e]" />
              </span>
              <h1 className="mb-3 text-center text-3xl font-semibold tracking-tight text-[#565656] md:text-4xl">Verificação em duas etapas</h1>
              <p className="mb-8 text-center text-base text-[#5f5f5f] text-pretty">Abra seu app autenticador e digite o código de 6 dígitos.</p>
              <form onSubmit={handleMfaSubmit} className="flex w-full flex-col gap-6">
                <label htmlFor="mfa-code" className="sr-only">Código de verificação</label>
                <input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isLoading}
                  className={`${inputClass} text-center font-mono text-3xl tracking-[0.5em]`}
                />
                {error && <div role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <button type="submit" disabled={isLoading || mfaCode.length !== 6} className="flex h-[72px] w-full items-center justify-center gap-2 rounded-sm bg-[#22c55e] text-xl font-medium text-[#ffffff] hover:bg-[#16a34a] disabled:opacity-70">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Verificando...</> : "Confirmar"}
                </button>
                <button type="button" onClick={cancelMfa} disabled={isLoading} className="text-center text-base font-medium text-[#22c55e] hover:text-[#16a34a]">
                  Voltar e entrar com outra conta
                </button>
              </form>
            </>
          ) : (
          <>
          <h1 className="mb-10 text-center text-4xl font-semibold tracking-tight text-[#565656] md:text-5xl">Entrar</h1>

          <form onSubmit={handleLogin} className="flex w-full flex-col gap-6">
            <input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={isLoading} className={inputClass} />
            <input type="password" placeholder="Senha" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={isLoading} className={inputClass} />

            {error && <div role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={isLoading} className="flex h-[72px] w-full items-center justify-center gap-2 rounded-sm bg-[#22c55e] text-xl font-medium text-[#ffffff] hover:bg-[#16a34a] disabled:opacity-70">
              {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Entrando...</> : "Entrar"}
            </button>

            <Link href="/auth/forgot-password" className="mt-4 text-center text-base font-medium text-[#22c55e] hover:text-[#16a34a]">Esqueceu sua senha?</Link>
            <p className="text-center text-base text-[#5f5f5f]">
              Ainda não tem uma conta?{" "}
              <Link href="/auth/sign-up" className="font-medium text-[#22c55e] hover:text-[#16a34a]">Criar conta</Link>
            </p>
          </form>
          </>
          )}

          <fieldset className="mt-12 w-full rounded-md border border-[#b0b0b0] px-6 py-5 text-[#5d5d5d]">
            <legend className="mx-auto px-4 text-base font-bold uppercase">Aviso de risco</legend>
            <p className="text-base leading-relaxed">Toda negociação envolve riscos. Opere apenas com capital que você está preparado para perder.</p>
          </fieldset>
        </section>
      </main>

      <footer className="border-t border-[#c7c7c7] bg-[#fbfafb] py-8 text-center text-base text-[#5d5d5d]">Fidex Option</footer>
    </div>
  )
}
