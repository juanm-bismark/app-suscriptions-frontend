"use server"

import { auth, signOut } from "@/auth"
import { logout } from "@/lib/api/auth"

export async function logoutAction() {
  const session = await auth()
  const refreshToken = session?.user?.refreshToken

  if (refreshToken) {
    await logout({ refresh_token: refreshToken }).catch(() => null)
  }

  await signOut({ redirectTo: "/login" })
}
