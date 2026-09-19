"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function BrandMark({ compact=false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "text-lg"}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111111] text-white shadow-sm"><span className="text-sm font-semibold">f</span></div>
      {!compact && <span className="font-semibold tracking-tight text-[#111111]">flayre</span>}
    </div>
  );
}
export function Button({ className="", variant="primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"; className?: string }) {
  const styles={primary:"bg-[#111111] text-white hover:bg-[#2a2a2a]",secondary:"border border-[#dedede] bg-white text-[#111111] hover:bg-[#f7f7f7]",ghost:"text-[#666] hover:bg-[#f3f3f3] hover:text-[#111111]"};
  return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}/>;
}
export function Card({children,className="",...props}:HTMLAttributes<HTMLDivElement>){return <div {...props} className={`rounded-2xl border border-[#e7e7e7] bg-white ${className}`}>{children}</div>}
export function Label({children}:{children:ReactNode}){return <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[#8a8a8a]">{children}</div>}
