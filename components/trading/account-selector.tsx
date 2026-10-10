"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Wallet, TrendingUp, Eye, EyeOff } from "lucide-react"

const HIDE_BALANCE_KEY = "polex:hide-balance"

interface AccountSelectorProps {
  balance: { real: number; demo: number }
  isDemo: boolean
  payout: number
  onToggleDemo: (isDemo: boolean) => void
}

export function AccountSelector({ balance, isDemo, payout, onToggleDemo }: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentBalance = isDemo ? balance.demo : balance.real
  const accountType = isDemo ? "Conta demo" : "Conta real"

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    setIsHidden(window.localStorage.getItem(HIDE_BALANCE_KEY) === "1")
  }, [])

  const toggleHidden = () => {
    setIsHidden((prev) => {
      const next = !prev
      window.localStorage.setItem(HIDE_BALANCE_KEY, next ? "1" : "0")
      return next
    })
  }

  const displayCurrency = (value: number) => (isHidden ? "R$ ••••••" : formatCurrency(value))

  const selectAccount = (demo: boolean) => {
    onToggleDemo(demo)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center bg-[#121826] border border-[#1F2933] rounded-lg hover:border-[#22c55e]/50 transition-colors">
        <button
          type="button"
          onClick={toggleHidden}
          aria-label={isHidden ? "Mostrar saldo" : "Ocultar saldo"}
          aria-pressed={isHidden}
          className="flex items-center justify-center w-11 h-11 shrink-0 text-[#9CA3AF] hover:text-white transition-colors"
        >
          {isHidden ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 min-h-11 pr-3 py-1.5"
        >
          <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-2">
            {/* Account Type + Payout Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[#9CA3AF] text-xs sm:text-sm whitespace-nowrap">{accountType}</span>
              <span className="bg-[#E91E63] text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
                +{payout}%
              </span>
            </div>

            {/* Balance */}
            <span className="text-white font-bold text-base sm:text-lg sm:ml-1 tabular-nums whitespace-nowrap leading-tight">
              {displayCurrency(currentBalance)}
            </span>
          </div>

          {/* Chevron */}
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#121826] border border-[#1F2933] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Demo Account Option */}
          <button
            onClick={() => selectAccount(true)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#1F2933] transition-colors ${
              isDemo ? "bg-[#22c55e]/10 border-l-2 border-[#22c55e]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDemo ? "bg-[#F59E0B]/20" : "bg-[#1F2933]"
                }`}
              >
                <TrendingUp className={`w-5 h-5 ${isDemo ? "text-[#F59E0B]" : "text-[#6B7280]"}`} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Conta demo</span>
                  <span className="bg-[#F59E0B]/20 text-[#F59E0B] text-xs px-2 py-0.5 rounded">PRÁTICA</span>
                </div>
                <span className="text-[#9CA3AF] text-sm">Treine sem riscos</span>
              </div>
            </div>
            <span className={`font-bold ${isDemo ? "text-[#F59E0B]" : "text-white"}`}>
              {displayCurrency(balance.demo)}
            </span>
          </button>

          {/* Divider */}
          <div className="border-t border-[#1F2933]" />

          {/* Real Account Option */}
          <button
            onClick={() => selectAccount(false)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#1F2933] transition-colors ${
              !isDemo ? "bg-[#22c55e]/10 border-l-2 border-[#22c55e]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  !isDemo ? "bg-[#22c55e]/20" : "bg-[#1F2933]"
                }`}
              >
                <Wallet className={`w-5 h-5 ${!isDemo ? "text-[#22c55e]" : "text-[#6B7280]"}`} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Conta real</span>
                  <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs px-2 py-0.5 rounded">DINHEIRO</span>
                </div>
                <span className="text-[#9CA3AF] text-sm">Opere com saldo real</span>
              </div>
            </div>
            <span className={`font-bold ${!isDemo ? "text-[#22c55e]" : "text-white"}`}>
              {displayCurrency(balance.real)}
            </span>
          </button>

          {/* Deposit Button */}
          <div className="border-t border-[#1F2933] p-3">
            <button className="w-full bg-[#22c55e] hover:bg-[#4ade80] text-white font-bold py-2.5 rounded-lg transition-colors">
              Depositar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
