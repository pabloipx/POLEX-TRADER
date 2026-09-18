"use client"

import Image from "next/image"
import { ChevronDown, Menu } from "lucide-react"
import { useMoney } from "./currency-context"
import { AffiliateBrand } from "./affiliate-brand"

interface AffiliateTopbarProps {
  userName: string
  balance: number
  nextPayment: string
  onMenuClick: () => void
}

export function AffiliateTopbar({ userName, balance, nextPayment, onMenuClick }: AffiliateTopbarProps) {
  const brl = useMoney()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:h-[72px] md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <AffiliateBrand className="h-8 shrink-0 md:h-9" />

        <button
          type="button"
          className="hidden items-center gap-2 rounded-full border border-gray-200 px-3.5 py-2 text-[15px] text-gray-800 transition-colors hover:bg-gray-50 md:flex"
        >
          <Image
            src="https://flagcdn.com/w40/br.png"
            alt="Brasil"
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
            unoptimized
          />
          Português
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <div className="hidden items-center gap-3 md:flex">
          <span className="text-[15px] text-gray-600">Próximo pagamento</span>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[15px] font-medium text-emerald-700">
            {nextPayment}
          </span>
        </div>

        <div className="hidden h-8 w-px bg-gray-200 md:block" />

        <span className="shrink-0 text-[15px] font-semibold text-gray-900 md:text-[17px]">{brl(balance)}</span>

        <div className="h-8 w-px bg-gray-200" />

        <p className="max-w-[110px] truncate text-right text-[15px] leading-tight text-gray-900 md:max-w-[180px]">
          {userName}
        </p>
      </div>
    </header>
  )
}
