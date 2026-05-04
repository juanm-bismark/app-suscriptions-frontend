import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LandingNav } from "@/app/_components/landing-nav"
import { HeroSection } from "@/app/_components/hero-section"
import { LandingFooter } from "@/app/_components/landing-footer"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-header-top via-header-bg to-header-bg">
      <LandingNav />
      <HeroSection />
      <LandingFooter />
    </div>
  )
}
