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
  LogOut,
  Zap,
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

  const displayName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const credits = remainingCredits ?? 10;
  const creditPercentage = Math.min(100, Math.max(0, (credits / 10) * 100));

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between rounded-2xl m-3 sticky top-4 h-[calc(100vh-2rem)] select-none shadow-sm transition-colors duration-200">
      {/* Top Section */}
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF5238] flex items-center justify-center shadow-md shadow-[#FF5238]/20">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </h2>
              {isPro && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {isPro ? "Unlimited Access" : `${credits} credits left`}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white border-l-2 border-[#FF5238]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active ? "text-[#FF5238]" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        {!isPro ? (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Free Quota</span>
              <span className="text-slate-900 dark:text-white font-bold">{credits}/10</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF5238] rounded-full transition-all duration-300"
                style={{ width: `${creditPercentage}%` }}
              />
            </div>

            <Link
              href="/pricing"
              className="clay-btn-primary w-full text-xs py-2 rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </Link>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
            <div className="inline-flex p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
              <Crown className="w-3.5 h-3.5 fill-current" />
            </div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Pro Plan Active</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Unlimited AI analyses</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
