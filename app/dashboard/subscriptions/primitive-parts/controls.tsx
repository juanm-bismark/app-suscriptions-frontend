"use client";

import type { CSSProperties, ReactNode } from "react";
import { T } from "../tokens";

export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 4,
        border: `1px solid ${active ? color || T.headerBg : T.border}`,
        background: active ? color || T.headerBg : "#fff",
        color: active ? "#fff" : T.text,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 0.1,
        fontFamily: T.fontBody,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

type BtnVariant = "primary" | "accent" | "danger" | "outline" | "ghost";

export function Btn({
  variant = "ghost",
  size = "md",
  icon,
  children,
  onClick,
  full,
  color,
  disabled,
  type = "button",
}: {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  color?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const padMap: Record<string, string> = { sm: "5px 10px", md: "7px 12px", lg: "10px 16px" };
  const fsMap: Record<string, number> = { sm: 12, md: 13, lg: 14 };
  let style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: padMap[size],
    borderRadius: 4,
    fontSize: fsMap[size],
    fontWeight: 600,
    fontFamily: T.fontBody,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    flex: full ? "1 1 0" : undefined,
    width: full ? "100%" : undefined,
    whiteSpace: "nowrap",
    letterSpacing: 0.1,
    transition: "background .12s, border-color .12s",
  };
  if (variant === "primary") {
    style = { ...style, background: color || T.headerBg, color: "#fff", border: `1px solid ${color || T.headerBg}` };
  } else if (variant === "accent") {
    style = { ...style, background: T.headerAccent, color: "#fff", border: `1px solid ${T.headerAccent}` };
  } else if (variant === "danger") {
    style = { ...style, background: "#fff", color: T.danger, border: `1px solid ${T.danger}66` };
  } else if (variant === "outline") {
    style = { ...style, background: "#fff", color: T.text, border: `1px solid ${T.border}` };
  } else {
    style = { ...style, background: "transparent", color: T.text, border: "1px solid transparent" };
  }
  return (
    <button onClick={onClick} disabled={disabled} type={type} style={style}>
      {icon}
      {children}
    </button>
  );
}
