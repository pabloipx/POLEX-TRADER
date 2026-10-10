import type { SupabaseClient } from "@supabase/supabase-js"

export async function needsMfaCode(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  return data?.nextLevel === "aal2" && data?.currentLevel !== "aal2"
}

export async function verifyMfaCode(supabase: SupabaseClient, code: string): Promise<string | null> {
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
  if (listError) return listError.message

  const factor = factors?.totp?.find((f) => f.status === "verified")
  if (!factor) return "Nenhum autenticador encontrado nesta conta."

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("invalid") || msg.includes("expired")) {
      return "Código inválido ou expirado. Confira o app autenticador e tente de novo."
    }
    return error.message
  }
  return null
}
