"use client"

import Link from "next/link"
import { AccountSelector } from "./account-selector"

interface TradingHeaderProps {
  balance: { real: number; demo: number }
  isDemo: boolean
  payout: number
  onToggleDemo: (isDemo: boolean) => void
}

export function TradingHeader({ balance, isDemo, payout, onToggleDemo }: TradingHeaderProps) {
  return (
    <header className="bg-[#7c2d12] border-b border-[#22c55e]/30 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/trade" className="flex items-center gap-2">
          <img
            src="/images/fidelity-logo.png"
            alt="Fidelity Broker"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Account Selector */}
        <AccountSelector balance={balance} isDemo={isDemo} payout={payout} onToggleDemo={onToggleDemo} />
      </div>
    </header>
  )
}
