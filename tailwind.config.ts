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
      },
      fontFamily: {
        body: "Arial, Helvetica, sans-serif",
        mono: "'Courier New', Courier, monospace",
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
