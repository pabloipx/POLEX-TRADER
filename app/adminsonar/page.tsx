import type { Metadata } from "next"
import { isSonarRequest } from "@/lib/sonar/session"
import { SonarLogin } from "@/components/sonar/sonar-login"
import { SonarPanel } from "@/components/sonar/sonar-panel"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Painel Sonar",
  robots: { index: false, follow: false },
}

export default async function AdminSonarPage() {
  const authenticated = await isSonarRequest()
  return authenticated ? <SonarPanel /> : <SonarLogin />
}
