import { type NextRequest, NextResponse } from "next/server"
import { amplopay } from "@/lib/amplopay"
import { createAdminClient } from "@/lib/supabase/admin"
import { approveDeposit, isPaidStatus } from "@/lib/deposits"
import { validatePromoCode } from "@/lib/promo-codes"

function isValidCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false
  const calculateDigit = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index++) sum += Number(value[index]) * (length + 1 - index)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return calculateDigit(9) === Number(value[9]) && calculateDigit(10) === Number(value[10])
}

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const body = await request.json()
    const { amount, promoCode, document } = body

    const cpf = typeof document === "string" ? document.replace(/\D/g, "") : ""
    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "Informe um CPF válido do titular da conta." }, { status: 400 })
    }

    const numericAmount =
      typeof amount === "string" ? Number.parseFloat(amount.replace(/[^\d.,]/g, "").replace(",", ".")) : Number(amount)

    if (isNaN(numericAmount) || numericAmount < 50) {
      return NextResponse.json({ error: "Valor minimo: R$ 50,00" }, { status: 400 })
    }

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle()

    const clientName = profile?.full_name?.trim()
    const clientEmail = profile?.email?.trim() || user.email?.trim()
    if (!clientName || !clientEmail) {
      return NextResponse.json({ error: "Complete seu nome e e-mail no perfil antes de gerar o PIX." }, { status: 400 })
    }

    const identifier = `DEP-${user.id.slice(0, 8)}-${Date.now()}`

    // Valida o codigo promocional AQUI, no servidor, antes de gravar no deposito. Nunca confiamos
    // no que a tela envia: o bonus e recalculado a partir da campanha no banco.
    // Codigo invalido nao derruba o deposito — apenas nao gera bonus.
    let validatedPromoCode: string | null = null
    if (typeof promoCode === "string" && promoCode.trim()) {
      const validation = await validatePromoCode(supabaseAdmin, promoCode, user.id, numericAmount)
      if (validation.valid) {
        validatedPromoCode = validation.promo.code
      } else {
        console.log(`[v0] Codigo promocional recusado no deposito: ${validation.error}`)
      }
    }

    // Insert deposit record
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("deposits")
      .insert({
        user_id: user.id,
        amount: numericAmount,
        method: "pix",
        status: "pending",
        external_id: identifier,
        promo_code: validatedPromoCode,
      })
      .select()
      .single()

    if (depositError) {
      console.error("[v0] Deposit insert error:", depositError)
      return NextResponse.json({ error: `Erro ao criar deposito: ${depositError.message}` }, { status: 500 })
    }

    try {
      const pixResponse = await amplopay.createPixPayment({
        amount: numericAmount,
        identifier: identifier,
        client: {
          name: clientName,
          email: clientEmail,
          phone: profile?.phone || "",
          document: cpf,
        },
        metadata: { userId: user.id, depositId: deposit.id },
      })

      if (!pixResponse.copyPaste) {
        await supabaseAdmin.from("deposits").delete().eq("id", deposit.id)
        return NextResponse.json({ error: "Erro: AmploPay nao retornou codigo PIX" }, { status: 500 })
      }

      // Update deposit with PIX data - save AmploPay internal transaction id for active status check
      //
      // `copy_paste` nao existe na tabela: enquanto era enviada, o Postgres recusava o update
      // INTEIRO, de modo que o QR Code e o `payment_reference` nunca eram salvos. Sem o
      // payment_reference, a verificacao de pagamento e o cron nao conseguiam localizar a cobranca
      // na AmploPay e o deposito ficava pendente para sempre, mesmo pago. O codigo copia-e-cola ja
      // e guardado em `qr_code`, portanto a coluna extra era redundante.
      const { error: pixUpdateError } = await supabaseAdmin
        .from("deposits")
        .update({
          qr_code: pixResponse.copyPaste,
          qr_code_base64: pixResponse.qrCode || "",
          external_id: identifier, // Keep our identifier
          payment_reference: pixResponse.providerTransactionId || null, // ID interno da AmploPay
        })
        .eq("id", deposit.id)

      if (pixUpdateError) {
        console.log("[v0] Erro ao salvar dados do PIX:", pixUpdateError.message)
        await supabaseAdmin.from("deposits").delete().eq("id", deposit.id)
        return NextResponse.json({ error: "Erro ao salvar dados do PIX" }, { status: 500 })
      }

      console.log("[PIX] Created deposit:", deposit.id, "identifier:", identifier, "providerTxId:", pixResponse.providerTransactionId)

      return NextResponse.json({
        success: true,
        deposit_id: deposit.id,
        transaction_id: pixResponse.transactionId,
        qr_code: pixResponse.copyPaste,
        qr_code_base64: pixResponse.qrCode,
        copy_paste: pixResponse.copyPaste,
        amount: numericAmount,
      })
    } catch (pixError: any) {
      console.error("[v0] AmploPay error:", pixError)
      await supabaseAdmin.from("deposits").delete().eq("id", deposit.id)
      return NextResponse.json({ error: pixError.message || "Erro ao gerar PIX" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] PIX route error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const depositId = searchParams.get("deposit_id")

    if (!depositId) {
      return NextResponse.json({ error: "deposit_id e obrigatorio" }, { status: 400 })
    }

    const { data: deposit, error } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error || !deposit) {
      return NextResponse.json({ error: "Deposito nao encontrado" }, { status: 404 })
    }

    // VERIFICACAO ATIVA: se ainda esta pendente, consulta o status direto na AmploPay.
    // Isso aprova o deposito automaticamente mesmo quando o webhook nao chega.
    if (deposit.status === "pending" && deposit.payment_reference) {
      try {
        const tx = await amplopay.getTransactionStatus(deposit.payment_reference)
        if (tx && isPaidStatus(tx.status)) {
          const result = await approveDeposit(supabaseAdmin, deposit, tx.id)
          if (result.approved) {
            console.log("[PIX] Deposito aprovado via verificacao ativa:", deposit.id)
          }
          return NextResponse.json({
            status: "approved",
            amount: deposit.amount,
            created_at: deposit.created_at,
            completed_at: new Date().toISOString(),
          })
        }
      } catch (verifyErr) {
        console.error("[PIX] Erro na verificacao ativa:", verifyErr)
        // Em caso de erro, segue retornando o status atual do banco
      }
    }

    return NextResponse.json({
      status: deposit.status,
      amount: deposit.amount,
      created_at: deposit.created_at,
      completed_at: deposit.completed_at,
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
