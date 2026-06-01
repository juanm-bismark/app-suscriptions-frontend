import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Page backgrounds
        page: "#EEF4F4",
        card: "#ffffff",
        border: "#C8DFE0",
        text: "#333333",
        title: "#111111",
        muted: "#555E6B",

        // Header
        "header-top": "#0F202A",
        "header-bg": "#163C41",
        "header-accent": "#33A6B2",
        "header-text": "#F3F7FA",
        "header-sub": "#8B9AAF",
        "header-meta": "#6D7E95",
        "header-client": "#62D7C7",
        "header-source": "#B8CDD6",
        "header-info-bg": "#1E3540",
        "header-info-border": "#2A6871",
        "header-info-text": "#62D7C7",
        "header-info-sub": "#7E8FA3",

        // Warning
        "warn-bg": "#3A2F1B",
        "warn-border": "#7C5B23",
        "warn-text": "#F2B64C",

        // Divider & Zebra
        divider: "#D4E8EA",
        zebra: "#F4FAFA",

        // Badge
        "badge-bg": "#C8E8EA",
        "badge-text": "#163C41",
        "plan-badge-bg": "#33A6B2",
        "plan-badge-text": "#ffffff",

        // Footer
        "footer-bg": "#D4E8EA",
        "footer-text": "#163C41",
        "footer-addr-bg": "#163C41",
        "footer-addr-text": "#3C8996",
        "footer-brand-text": "#ffffff",
        "footer-divider": "#33A6B2",
        "support-text": "#326472",

        // Table
        "table-header-bg": "#F0F8F8",
        "table-header-text": "#326472",
        "row-divider": "#EEF1F6",

        // Row Hover
        "row-over-bg": "#FFF0EE",
        "row-over-bg-alt": "#FAE4E2",
        "row-over-border": "#F4A99A",
        "row-over-border-out": "#E8A090",

        // Dashboard surfaces
        "panel-soft": "#F5FAFA",
        "accent-soft": "#DDF1F2",
        "hover-soft": "#EAF6F7",
        "soft-border": "#C9DFE3",
        "soft-focus": "#BFE5E8",
        "ink-teal": "#12343B",
        "action-soft": "#285F68",
        "warning-soft": "#FFF7E7",
        "warning-border-soft": "#F2D49B",
        "warning-text-soft": "#6D4D16",
        "warning-icon-soft": "#765315",
        "warning-hover-soft": "#4A3010",
        "success-soft": "#DDF4EA",
        "success-text-soft": "#16603B",
        "danger-soft": "#F5EAEA",
        "danger-text-soft": "#7A3535",
        "danger-action": "#DC2626",
        "danger-action-hover": "#B91C1C",
        "danger-action-dark": "#7F1D1D",
        "danger-tint": "#FEE2E2",
        "danger-strong-text": "#991B1B",
        "divider-soft": "#D8E7EA",
        "skeleton-soft": "#DDECEE",
        "skeleton-muted": "#E5F0F1",
        "previous-soft": "#E8EEF2",
        "next-soft": "#D8F0F2",
        "action-teal": "#0E7490",
        "action-teal-hover": "#0F4C5C",
        "action-teal-soft": "#ECFEFF",
        "metric-soft": "#EAF6F7",
        "provider-kite-soft": "#E5F5F6",
        "provider-tele2-soft": "#F0EAFB",
        "provider-moabits-soft": "#FCEADC",
        "role-manager-soft": "#EDE5FB",
        "role-manager-text": "#422889",
        "role-admin-text": "#7A3A10",
        "slate-muted": "#475569",
        "slate-strong": "#334155",
        "slate-border": "#94A3B8",
        "disabled-soft": "#EEF3F5",
        "nav-soft": "#E7F4F2",
        "nav-shadow": "#6A9AA0",
        "nav-button-soft": "#F6FCFC",
        "nav-button-text": "#226F78",
        "nav-button-hover": "#184F56",
        "nav-avatar": "#2B8790",
        "dark-skeleton": "#060D13",
        "strong-border": "#12343B",
        "soft-border-hover": "#A5CDD3",
        "warning-hover-bg": "#FEEAC8",
      },
      fontFamily: {
        body: "Arial, Helvetica, sans-serif",
        mono: "'Courier New', Courier, monospace",
      },
      opacity: {
        // Semantic opacity values
        "translucent-nav": "0.95", // Navigation backdrop
        "hover-emphasis": "0.90", // Button hover states
        "soft-bg": "0.50", // Soft background overlays
        "badge": "0.10", // Badge backgrounds
        "disabled": "0.50", // Disabled state
        "subtle": "0.60", // Subtle text/elements
        "strong": "0.85", // Strong emphasis
        "blob": "0.20", // Background blob decorations
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
