import Image from "next/image"

const LOGO_URL = "https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"

type LogoSize = "sm" | "md" | "lg"

const SIZE_CONFIG: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 104, height: 34 },
  md: { width: 120, height: 32 },
  lg: { width: 160, height: 64 },
}

interface LogoProps {
  size?: LogoSize
  priority?: boolean
  className?: string
}

export function Logo({ size = "md", priority = false, className = "" }: LogoProps) {
  const config = SIZE_CONFIG[size]
  const loading = priority ? "eager" : "lazy"
  const fetchPriority = priority ? "high" : "auto"

  return (
    <Image
      src={LOGO_URL}
      alt="Bismark Logo"
      width={config.width}
      height={config.height}
      priority={priority}
      loading={loading}
      fetchPriority={fetchPriority}
      style={{ width: "auto", height: "auto" }}
      className={`object-contain ${className}`}
    />
  )
}
