import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { amount, pixKey, pixKeyType } = await request.json()

    if (!pixKey || !pixKeyType) {
      return NextResponse.json({ error: "Chave PIX e obrigatoria" }, { status: 400 })
    }

    const numericAmount = Number(amount)
    const normalizedPixKey = String(pixKey).trim()
    const normalizedPixKeyType = String(pixKeyType).trim()

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      Math.round(numericAmount * 100) !== numericAmount * 100
    ) {
      return NextResponse.json({ error: "Informe um valor de saque válido" }, { status: 400 })
    }

    const { data, error: withdrawalError } = await supabase.rpc(
      "request_affiliate_withdrawal_atomic",
      {
        p_amount: numericAmount,
        p_pix_key: normalizedPixKey,
        p_pix_key_type: normalizedPixKeyType,
      },
    )

    if (withdrawalError) {
      const message = withdrawalError.message ?? ""
      if (message.includes("INVALID_AMOUNT")) {
        return NextResponse.json({ error: "Valor abaixo do mínimo permitido" }, { status: 400 })
      }
      if (message.includes("INVALID_PIX")) {
        return NextResponse.json({ error: "Chave PIX inválida" }, { status: 400 })
      }
      if (message.includes("INSUFFICIENT_BALANCE")) {
        return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
      }
      if (message.includes("NOT_AFFILIATE") || message.includes("PROFILE_NOT_FOUND")) {
        return NextResponse.json({ error: "Perfil de afiliado não encontrado" }, { status: 404 })
      }
      throw withdrawalError
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao criar saque:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
