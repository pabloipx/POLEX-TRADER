"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { persistReferral } from "@/lib/referral"

function ReferralCaptureInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    const subid = searchParams.get("subid") ?? searchParams.get("sub_id")
    if (ref || subid) {
      persistReferral(ref, subid)
    }
  }, [searchParams])

  return null
}

/**
 * Captura o código de afiliado (?ref=) em qualquer página e o persiste,
 * garantindo a atribuição mesmo que o usuário navegue antes de se cadastrar.
 */
export function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner />
    </Suspense>
  )
}
