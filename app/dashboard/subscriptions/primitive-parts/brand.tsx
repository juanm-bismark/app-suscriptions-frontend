"use client";

import { T } from "../tokens";

export function Avatar({
  name,
  size = 24,
  color = T.headerAccent,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color + "22",
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        letterSpacing: 0.2,
        fontFamily: T.fontBody,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function BismarkMark({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: light ? "#fff" : T.headerAccent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: light ? T.headerBg : "#fff",
          fontFamily: T.fontMono,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        b.
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: -0.3,
          color: light ? "#fff" : T.title,
        }}
      >
        bismark
      </div>
    </div>
  );
}
