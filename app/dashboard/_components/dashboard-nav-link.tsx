"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type DashboardNavLinkVariant = "desktop" | "mobile"

interface DashboardNavLinkProps {
  href: string
  label: string
  variant?: DashboardNavLinkVariant
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardNavLink({ href, label, variant = "desktop" }: DashboardNavLinkProps) {
  const pathname = usePathname()
  const active = isActivePath(pathname, href)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-colors",
        variant === "desktop" ? "h-full px-1 text-sm" : "h-8 px-0.5 text-sm",
        active
          ? "text-title font-bold shadow-[inset_0_-3px_0_0_#33A6B2]"
          : "text-muted hover:text-title",
      )}
    >
      {label}
    </Link>
  )
}
