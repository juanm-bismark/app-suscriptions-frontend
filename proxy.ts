import { NextResponse } from "next/server"
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isOnDashboard = path.startsWith("/dashboard")
  const isOnAuthPage = path === "/login" || path === "/register"
  const hasRefreshError = req.auth?.user?.error === "RefreshAccessTokenError"

  if (isOnDashboard && (!isLoggedIn || hasRefreshError)) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", path + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Prevent an authenticated session from hitting /register — it would send
  // the bearer token in any subsequent signup attempt and switch the backend
  // to "invite into my company" mode (contract §1.1). Same UX for /login.
  if (isOnAuthPage && isLoggedIn && !hasRefreshError) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
