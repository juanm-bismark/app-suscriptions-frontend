"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
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
  const activeColor = color || T.headerBg;
  const style = { "--control-color": activeColor } as CSSProperties;

  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2.5 py-1.5 font-body text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent focus-visible:ring-offset-2",
        active
          ? "border-[var(--control-color)] bg-[var(--control-color)] text-white hover:brightness-95"
          : "border-border bg-card text-text hover:bg-hover-soft hover:text-title"
      )}
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
  const style = {
    "--button-color": color || T.headerBg,
    padding: padMap[size],
    fontSize: fsMap[size],
    flex: full ? "1 1 0" : undefined,
    width: full ? "100%" : undefined,
  } as CSSProperties;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={style}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded border font-body font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-[var(--button-color)] bg-[var(--button-color)] text-white hover:brightness-95",
        variant === "accent" && "border-header-accent bg-header-accent text-white hover:bg-action-teal",
        variant === "danger" && "border-danger-action/40 bg-card text-danger-action hover:bg-danger-tint",
        variant === "outline" && "border-border bg-card text-text hover:bg-hover-soft hover:text-title",
        variant === "ghost" && "border-transparent bg-transparent text-text hover:bg-hover-soft hover:text-title"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
