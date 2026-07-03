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
      className="flex shrink-0 items-center justify-center rounded-full font-body font-bold tracking-[0.2px]"
      style={{ width: size, height: size, background: `${color}22`, color, fontSize: size * 0.42 }}
    >
      {initials}
    </div>
  );
}

export function BismarkMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] font-mono text-[13px] font-bold tracking-[-1px]"
        style={{ background: light ? "#fff" : T.headerAccent, color: light ? T.headerBg : "#fff" }}
      >
        b.
      </div>
      <div
        className="font-body text-[15px] font-bold tracking-[-0.3px]"
        style={{ color: light ? "#fff" : T.title }}
      >
        bismark
      </div>
    </div>
  );
}
