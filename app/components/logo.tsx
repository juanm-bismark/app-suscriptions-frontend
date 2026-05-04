import Image from "next/image"

const LOGO_URL = "https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"

type LogoSize = "sm" | "md" | "lg"

const SIZE_CONFIG: Record<LogoSize, { width: number; height: number; className: string }> = {
  sm: { width: 104, height: 34, className: "h-7 w-auto" },
  md: { width: 120, height: 32, className: "h-8 w-auto" },
  lg: { width: 160, height: 64, className: "h-16 w-auto" },
}

interface LogoProps {
  size?: LogoSize
  priority?: boolean
  className?: string
}

export function Logo({ size = "md", priority = false, className = "" }: LogoProps) {
  const config = SIZE_CONFIG[size]
  return (
    <Image
      src={LOGO_URL}
      alt="Bismark Logo"
      width={config.width}
      height={config.height}
      priority={priority}
      className={`${config.className} object-contain ${className}`}
    />
  )
}
