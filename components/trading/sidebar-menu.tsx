"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { computeRank, applyRankOverride, type Rank } from "@/lib/ranks"
import {
  X,
  History,
  User,
  CreditCard,
  Banknote as Banknotes,
  MessageCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  Shield,
  Wallet,
} from "lucide-react"

interface SidebarMenuProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  balance?: number
  onOpenTraderIA?: () => void
  userId?: string
  historyRefresh?: number
}

export function SidebarMenu({
  isOpen,
  onClose,
  userName,
  balance,
  userId,
}: SidebarMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [vipRank, setVipRank] = useState<Rank | null>(null)

  useEffect(() => {
    if (!isOpen || !userId) return
    let active = true

    async function loadRank() {
      try {
        const supabase = createClient()

        const { data: profileData } = await supabase
          .from("profiles")
          .select("vip_level_override")
          .eq("id", userId)
          .single()

        const { data: depositsData } = await supabase
          .from("deposits")
          .select("amount, status")
          .eq("user_id", userId)
          .in("status", ["approved", "completed"])

        const totalDeposited = (depositsData || []).reduce(
          (sum: number, d: { amount: number | null }) => sum + Number(d.amount || 0),
          0,
        )

        const { count: entriesCount } = await supabase
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_demo", false)

        const baseRank = computeRank(totalDeposited, entriesCount || 0)
        const resolved = applyRankOverride(
          baseRank,
          (profileData as { vip_level_override?: string | null })?.vip_level_override,
        )
        if (active) setVipRank(resolved.current)
      } catch (error) {
        console.error("Rank load error:", error)
      }
    }

    loadRank()
    return () => {
      active = false
    }
  }, [isOpen, userId])

  const handleNavigation = (href: string) => {
    onClose()
    window.location.href = href
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  const mainMenuItems = [
    { icon: History, label: "Historico", href: "/transactions" },
    { icon: User, label: "Perfil", href: "/profile" },
  ]

  const financeMenuItems = [
    { icon: CreditCard, label: "Deposito", href: "/deposit" },
    { icon: Banknotes, label: "Saque", href: "/withdraw" },
  ]

  const supportMenuItems = [
    { icon: MessageCircle, label: "Suporte", href: "/suporte" },
  ]

  const formatBRL = (value: number | undefined | null) => {
    const safeValue = typeof value === "number" && !isNaN(value) ? value : 0
    return safeValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const menuGroups = [
    { title: "Conta", items: mainMenuItems },
    { title: "Financeiro", items: financeMenuItems },
    { title: "Ajuda", items: supportMenuItems },
  ]

  const rankColor = vipRank?.color ?? "#4ade80"

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Menu da conta"
        className={`fixed top-0 left-0 h-full w-[300px] md:w-[340px] z-50 transform transition-transform duration-300 ease-out flex flex-col bg-[#0a0d12] border-r border-white/[0.06] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-shrink-0 px-5 pt-5">
          <div className="flex items-center justify-between mb-6">
            <img src="/images/fidelity-logo.png" alt="Fidex Option" className="h-7 w-auto" />
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#22c55e] to-[#15803d] flex items-center justify-center">
                <span className="text-white font-bold text-base">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4ade80] ring-2 ring-[#0a0d12]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-[15px] leading-tight truncate">{userName || "Trader"}</div>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3" style={{ color: rankColor }} />
                <span className="text-[11px] font-medium" style={{ color: rankColor }}>
                  VIP {vipRank?.name ?? "Bronze"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/45 text-xs font-medium">Saldo disponível</span>
              <span className="flex items-center gap-1 text-[#4ade80] text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                85%
              </span>
            </div>
            <div className="text-white font-bold text-[26px] leading-none tracking-tight tabular-nums">
              {formatBRL(balance)}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => handleNavigation("/deposit")}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#04140a] text-[13px] font-semibold transition"
              >
                <Wallet className="w-4 h-4" />
                Depositar
              </button>
              <button
                onClick={() => handleNavigation("/withdraw")}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-[13px] font-semibold transition"
              >
                <Banknotes className="w-4 h-4" />
                Sacar
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-5">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <div className="px-1 mb-2 text-[11px] font-medium text-white/35">{group.title}</div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href)}
                    className="w-full flex items-center gap-3 px-4 h-12 text-white/85 hover:text-white hover:bg-white/[0.04] transition group"
                  >
                    <item.icon className="w-[18px] h-[18px] text-white/45 group-hover:text-[#4ade80] transition" />
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 px-5 py-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-red-400 hover:bg-red-500/[0.08] text-sm font-medium transition disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </aside>
    </>
  )
}
