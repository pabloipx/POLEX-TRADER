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
  Bot,
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
    { icon: Bot, label: "IAs conectadas", href: "/connections" },
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

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] md:w-[340px] z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0d1117" }}
      >
        {/* Header with user info */}
        <div className="p-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <img
              src="/images/fidelity-logo.png"
              alt="Fidex Option"
              className="h-8 w-auto"
            />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="relative rounded-2xl overflow-hidden mb-5 bg-[#111820] border border-white/[0.08]">
            {/* subtle top glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-32 bg-[#22c55e]/15 blur-3xl" />
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#0d1117] ring-2 ring-[#22c55e]/60 flex items-center justify-center">
                    <span className="text-[#4ade80] font-bold text-lg">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22c55e] ring-2 ring-[#111820]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{userName || "Trader"}</div>
                  <div
                    className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${vipRank?.color ?? "#22c55e"}1a`,
                      borderColor: `${vipRank?.color ?? "#22c55e"}33`,
                    }}
                  >
                    <Shield className="w-2.5 h-2.5" style={{ color: vipRank?.color ?? "#4ade80" }} />
                    <span
                      className="text-[10px] font-semibold tracking-wide"
                      style={{ color: vipRank?.color ?? "#4ade80" }}
                    >
                      VIP {vipRank?.name ?? "Bronze"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.06] mb-3" />

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1">Saldo Disponivel</div>
                  <div className="text-white font-bold text-2xl tracking-tight tabular-nums">{formatBRL(balance)}</div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#22c55e]/15 rounded-lg">
                  <TrendingUp className="w-3 h-3 text-[#4ade80]" />
                  <span className="text-[#4ade80] text-[10px] font-bold">85%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleNavigation("/deposit")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#c2410c] text-white text-xs font-semibold transition shadow-lg shadow-orange-500/20"
            >
              <Wallet className="w-3.5 h-3.5" />
              Depositar
            </button>
            <button
              onClick={() => handleNavigation("/withdraw")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition border border-white/10"
            >
              <Banknotes className="w-3.5 h-3.5" />
              Sacar
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/[0.06]" />

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-1">
            <span className="px-3 text-[10px] uppercase tracking-widest text-white/25 font-semibold">Conta</span>
          </div>
          {mainMenuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-[#22c55e]/10 flex items-center justify-center transition">
                <item.icon className="w-4 h-4 text-white/40 group-hover:text-[#4ade80] transition" />
              </div>
              <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition" />
            </button>
          ))}

          <div className="mt-4 mb-1">
            <span className="px-3 text-[10px] uppercase tracking-widest text-white/25 font-semibold">Financeiro</span>
          </div>
          {financeMenuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-[#22c55e]/10 flex items-center justify-center transition">
                <item.icon className="w-4 h-4 text-white/40 group-hover:text-[#4ade80] transition" />
              </div>
              <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition" />
            </button>
          ))}

          <div className="mt-4 mb-1">
            <span className="px-3 text-[10px] uppercase tracking-widest text-white/25 font-semibold">Ajuda</span>
          </div>
          {supportMenuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-[#22c55e]/10 flex items-center justify-center transition">
                <item.icon className="w-4 h-4 text-white/40 group-hover:text-[#4ade80] transition" />
              </div>
              <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition" />
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] rounded-xl transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/[0.06] group-hover:bg-red-500/10 flex items-center justify-center transition">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="flex-1 text-left text-[13px] font-medium">
              {isLoggingOut ? "Saindo..." : "Sair da Conta"}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
