"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Sparkles,
  History,
  CreditCard,
  Crown,
  Flame,
  Headphones,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  remainingCredits?: number | null;
  isPro?: boolean;
}

export function Sidebar({ remainingCredits, isPro }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze", label: "Analyze", icon: Sparkles },
    { href: "/history", label: "History", icon: History },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  const displayName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Friend";

  return (
    <aside className="w-64 shrink-0 bg-[#9DBEB1] dark:bg-[#162B21] p-4 flex flex-col justify-between rounded-3xl m-3 sm:m-4 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto shadow-[0_16px_36px_-6px_rgba(120,160,145,0.5),inset_0_2px_4px_rgba(255,255,255,0.85),inset_0_-2px_4px_rgba(100,140,125,0.3)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.08),inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-white/60 dark:border-white/10 select-none transition-colors duration-200">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Avatar & Greeting Pill */}
        <div className="flex flex-col items-center text-center pt-2 space-y-2">
          <div className="relative">
            {/* 3D Clay Flame Mascot with Headphones */}
            <div className="w-18 h-18 rounded-full bg-[#FFFFFF] dark:bg-[#1E1A16] p-1 shadow-[0_8px_20px_rgba(90,130,115,0.4),inset_0_2px_3px_#FFF,inset_0_-2px_4px_rgba(160,140,120,0.22)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D36A48] via-[#E28E6E] to-[#F8D57E] flex items-center justify-center shadow-inner relative overflow-hidden">
                <Flame className="w-8 h-8 text-white drop-shadow-md" />
                <Headphones className="w-10 h-10 text-[#102B20] dark:text-[#0A1A14] absolute -top-0.5 drop-shadow-sm opacity-95" />
              </div>
            </div>
            {/* Status dot */}
            <span className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1A16] shadow-sm" />
          </div>

          <div>
            <h2 className="text-base font-black text-[#0C1E17] dark:text-[#E8F7F0] tracking-tight">
              Hi, {displayName}! 👋
            </h2>
            <p className="text-xs font-bold text-[#1E3B30] dark:text-[#A3CCBA]">
              {isPro ? "Pro Member" : `${remainingCredits ?? 10} analyses left`}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                  active
                    ? "clay-nav-active"
                    : "clay-nav-inactive"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                    active
                      ? "text-[#0E2B1F] dark:text-[#E8F7F0] scale-110"
                      : "text-[#102B20] dark:text-[#A3CCBA]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pro Upgrade Card */}
      <div className="space-y-3 pt-4">
        {!isPro ? (
          <div className="clay-card-terracotta p-4 text-center space-y-3 relative overflow-hidden">
            {/* 3D Crown Badge */}
            <div className="w-10 h-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#3D1A12] shadow-[0_4px_10px_rgba(211,106,72,0.3),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center mx-auto text-[#D36A48]">
              <Crown className="w-5 h-5 fill-current" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-[#3D1409] dark:text-[#F8C4B5]">Go Pro</h3>
              <p className="text-[11px] font-bold text-[#632717] dark:text-[#E5A998] leading-tight">
                Unlock unlimited AI replies and deep context!
              </p>
            </div>

            <Link
              href="/pricing"
              className="clay-btn clay-btn-primary w-full text-xs py-2.5 rounded-xl font-bold inline-flex items-center justify-center"
            >
              Upgrade Now
            </Link>
          </div>
        ) : (
          <div className="clay-card-sage p-3.5 text-center space-y-1">
            <div className="inline-flex p-1.5 rounded-xl bg-white dark:bg-[#1B3629] shadow-sm text-emerald-700 dark:text-emerald-400 mb-1">
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs font-black text-[#0E281D] dark:text-[#C5EAD8]">Pro Active</p>
            <p className="text-[11px] font-bold text-[#1C3B2E] dark:text-[#A3D9C0]">Unlimited Analyses</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#153124] dark:text-[#A3CCBA] hover:text-[#05130D] dark:hover:text-[#FFFFFF] hover:bg-white/40 dark:hover:bg-white/10 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
