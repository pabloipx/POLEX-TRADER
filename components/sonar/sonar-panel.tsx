"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { AdminManipulation } from "@/components/admin/sections/admin-manipulation"

export function SonarPanel() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  async function handleLogout() {
    setLeaving(true)
    await fetch("/api/adminsonar/session", { method: "DELETE" }).catch(() => {})
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <span className="text-sm font-semibold text-foreground">Painel Sonar</span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </button>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <AdminManipulation />
      </main>
    </div>
  )
}
