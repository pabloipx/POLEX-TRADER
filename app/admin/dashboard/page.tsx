import { Suspense } from "react"
import { redirect } from "next/navigation"
import { isAdminRequest } from "@/lib/admin/session"
import AdminDashboardClient from "./admin-dashboard-client"

export default async function AdminDashboardPage() {
  if (!(await isAdminRequest())) redirect("/admin001")

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <AdminDashboardClient />
    </Suspense>
  )
}
