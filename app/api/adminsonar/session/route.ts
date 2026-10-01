import { type NextRequest, NextResponse } from "next/server"
import {
  SONAR_COOKIE,
  createSonarSessionValue,
  sonarCookieOptions,
  verifySonarCredentials,
} from "@/lib/sonar/session"

export async function POST(req: NextRequest) {
  let email = ""
  let password = ""
  try {
    const body = await req.json()
    email = typeof body?.email === "string" ? body.email.slice(0, 200) : ""
    password = typeof body?.password === "string" ? body.password.slice(0, 200) : ""
  } catch {
    return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 })
  }

  if (!email || !password || !(await verifySonarCredentials(email, password))) {
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(SONAR_COOKIE, await createSonarSessionValue(), sonarCookieOptions())
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(SONAR_COOKIE, "", sonarCookieOptions(0))
  return res
}
