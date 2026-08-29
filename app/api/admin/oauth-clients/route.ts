import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { checkAdmin } from "@/lib/admin/check-admin"
import { randomToken, sha256 } from "@/lib/oauth"
import { createAdminClient } from "@/lib/supabase/admin"

const clientSchema = z.object({
  name: z.string().trim().min(2).max(80),
  redirectUris: z.array(z.string().url()).min(1).max(5).refine((uris) => uris.every((uri) => {
    const url = new URL(uri)
    return url.protocol === "https:" || url.hostname === "localhost"
  }), "Somente HTTPS ou localhost"),
})

export async function POST(request: Request) {
  const { isAdmin } = await checkAdmin()
  if (!isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const parsed = clientSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 400 })

  const clientId = `fid_${randomUUID().replaceAll("-", "")}`
  const registrationSecret = randomToken(32)
  const admin = createAdminClient()
  const { error } = await admin.from("oauth_clients").insert({
    client_id: clientId,
    client_secret_hash: sha256(registrationSecret),
    name: parsed.data.name,
    redirect_uris: parsed.data.redirectUris,
  })
  if (error) return NextResponse.json({ error: "Não foi possível cadastrar o aplicativo" }, { status: 500 })

  return NextResponse.json({
    clientId,
    authorizationEndpoint: "/oauth/authorize",
    tokenEndpoint: "/api/oauth/token",
    note: "Cliente público com PKCE S256. O segredo de cadastro não é usado na troca de token.",
  }, { status: 201, headers: { "Cache-Control": "no-store" } })
}
