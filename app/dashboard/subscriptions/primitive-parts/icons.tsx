"use client";

type IconProps = { size?: number };

export const Icon = {
  search: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" />
    </svg>
  ),
  close: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  ),
  filter: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 3h12M4 8h8M6 13h4" />
    </svg>
  ),
  refresh: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4h-4" />
      <path d="M2 13v-4h4" />
      <path d="M13.5 7a5.5 5.5 0 0 0-10-2L2 7" />
      <path d="M2.5 9a5.5 5.5 0 0 0 10 2L14 9" />
    </svg>
  ),
  warn: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L1.5 13.5h13L8 2z" />
      <path d="M8 6.5v3.5" />
      <circle cx="8" cy="12" r=".8" fill="currentColor" stroke="none" />
    </svg>
  ),
  play: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
      <path d="M3 2l7 4-7 4V2z" />
    </svg>
  ),
  pause: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
      <rect x="3" y="2" width="2.5" height="8" rx="0.4" />
      <rect x="6.5" y="2" width="2.5" height="8" rx="0.4" />
    </svg>
  ),
  plus: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 2v8M2 6h8" />
    </svg>
  ),
  copy: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <path d="M2 8V2a1 1 0 0 1 1-1h6" />
    </svg>
  ),
  arrowRight: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" />
    </svg>
  ),
  arrowLeft: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 6h-7M5.5 3l-3 3 3 3" />
    </svg>
  ),
  chev: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  ),
  check: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5L5 9l4.5-5.5" />
    </svg>
  ),
  history: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 1 0 6-6M2 4v4h4" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  ),
  download: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v9M4 7l4 4 4-4" />
      <path d="M2 13h12" />
    </svg>
  ),
};
