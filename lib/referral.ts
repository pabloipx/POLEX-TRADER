// Persistência do código de afiliado (ref) e da campanha (subid).
// O código pode chegar em qualquer página (home, sign-up, etc.). Guardamos em
// cookie + localStorage para que a atribuição sobreviva à navegação até o cadastro.

const REF_KEY = "fx_ref_code"
const SUBID_KEY = "fx_ref_subid"
const MAX_AGE_DAYS = 90

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : ""
}

function sanitizeCode(raw: string): string {
  // Códigos de afiliado são alfanuméricos; normalizamos para maiúsculo.
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 32)
}

function sanitizeSubId(raw: string): string {
  return raw.trim().slice(0, 64)
}

/** Guarda o código/subid do afiliado, se ainda não houver um capturado. */
export function persistReferral(refCode?: string | null, subId?: string | null) {
  if (typeof window === "undefined") return

  const code = refCode ? sanitizeCode(refCode) : ""
  if (code) {
    // Primeiro toque vence: não sobrescreve uma indicação já capturada.
    const existing = getStoredReferral().code
    if (!existing) {
      try {
        window.localStorage.setItem(REF_KEY, code)
      } catch {}
      setCookie(REF_KEY, code)
    }
  }

  if (subId) {
    const sub = sanitizeSubId(subId)
    if (sub) {
      try {
        window.localStorage.setItem(SUBID_KEY, sub)
      } catch {}
      setCookie(SUBID_KEY, sub)
    }
  }
}

/** Lê o código/subid capturado (localStorage tem prioridade, cookie é fallback). */
export function getStoredReferral(): { code: string; subId: string } {
  if (typeof window === "undefined") return { code: "", subId: "" }

  let code = ""
  let subId = ""
  try {
    code = window.localStorage.getItem(REF_KEY) || ""
    subId = window.localStorage.getItem(SUBID_KEY) || ""
  } catch {}

  if (!code) code = getCookie(REF_KEY)
  if (!subId) subId = getCookie(SUBID_KEY)

  return { code: sanitizeCode(code), subId: sanitizeSubId(subId) }
}

/** Limpa a indicação após o cadastro ser concluído. */
export function clearStoredReferral() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(REF_KEY)
    window.localStorage.removeItem(SUBID_KEY)
  } catch {}
  document.cookie = `${REF_KEY}=; path=/; max-age=0`
  document.cookie = `${SUBID_KEY}=; path=/; max-age=0`
}
