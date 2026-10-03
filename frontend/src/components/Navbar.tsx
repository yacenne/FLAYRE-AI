"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Flame,
  Search,
  Bell,
  User,
  Menu,
  X,
  CreditCard,
  Sparkles,
  LayoutDashboard,
  History,
  Crown,
  Sun,
  Moon,
  CheckCircle2,
  Info,
} from "lucide-react";

interface NavbarProps {
  title?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  remainingCredits?: number | null;
  isPro?: boolean;
}

export function Navbar({
  title,
  onSearch,
  searchPlaceholder = "Search conversations, tones...",
  remainingCredits,
  isPro,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Welcome to flayre.ai!",
      message: "10 free AI analyses are ready in your account this month.",
      time: "Just now",
      read: false,
    },
    {
      id: "2",
      title: "Vision Model Online",
      message: "WhatsApp, Instagram, and Discord OCR processing at peak speed.",
      time: "10m ago",
      read: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      router.push(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Unauthenticated / Landing Page Header
  if (!isAuthenticated || pathname === "/") {
    return (
      <header className="sticky top-0 z-50 bg-[var(--clay-bg)]/90 backdrop-blur-md border-b border-[#DCD0C1] dark:border-[#2F2821] px-4 sm:px-8 py-3.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D36A48] to-[#E5BF67] flex items-center justify-center shadow-[0_4px_10px_rgba(211,106,72,0.35),inset_0_1px_2px_#FFF] group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-[#14100D] dark:text-[#FAF6F0]">
              flayre<span className="text-[#D36A48]">.ai</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[#3B3026] dark:text-[#D5CBC0]">
            <a href="#features" className="hover:text-[#000000] dark:hover:text-[#FFFFFF] transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#000000] dark:hover:text-[#FFFFFF] transition">
              How It Works
            </a>
            <Link href="/pricing" className="hover:text-[#000000] dark:hover:text-[#FFFFFF] transition">
              Pricing
            </Link>
          </nav>

          {/* Auth & Dark Mode Actions */}
          <div className="flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#221E19] shadow-[0_4px_10px_rgba(125,95,75,0.18),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.08)] border border-[#E2D7C8] dark:border-[#383027] flex items-center justify-center text-[#211A14] dark:text-[#FAF6F0] hover:text-[#D36A48] dark:hover:text-[#E06C46] transition"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#4A3E33]" />
              )}
            </button>

            <Link href="/login" className="clay-btn clay-btn-secondary text-xs sm:text-sm py-2 px-3.5">
              Sign In
            </Link>
            <Link href="/login" className="clay-btn clay-btn-primary text-xs sm:text-sm py-2 px-4">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Authenticated Top Utility Bar
  return (
    <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Page Title & Mobile Drawer Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-10 h-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#221E19] shadow-[0_4px_10px_rgba(125,95,75,0.18),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-[#E2D7C8] dark:border-[#383027] flex items-center justify-center text-[#211A14] dark:text-[#FAF6F0]"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {title && (
          <h1 className="text-xl sm:text-2xl font-black text-[#14100D] dark:text-[#FAF6F0] tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Center Search Pill */}
      <div className="flex-1 max-w-md hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#6E6153] dark:text-[#8C8072] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="clay-input pl-10 pr-4 py-2 text-xs w-full"
          />
        </form>
      </div>

      {/* Right Controls: Theme Toggle, Credits Pill, Notifications Bell, Profile Circle */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#221E19] shadow-[0_4px_10px_rgba(125,95,75,0.18),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.08)] border border-[#E2D7C8] dark:border-[#383027] flex items-center justify-center text-[#211A14] dark:text-[#FAF6F0] hover:text-[#D36A48] dark:hover:text-[#E06C46] transition"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#4A3E33]" />
          )}
        </button>

        {/* Remaining Credits Pill */}
        {remainingCredits !== undefined && remainingCredits !== null && (
          <Link
            href="/pricing"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#221E19] shadow-[0_3px_8px_rgba(125,95,75,0.18),inset_0_1px_2px_#FFF] dark:shadow-[0_3px_8px_rgba(0,0,0,0.4)] border border-[#E2D7C8] dark:border-[#383027] text-xs font-bold text-[#362D24] dark:text-[#D5CBC0] hover:text-[#D36A48] dark:hover:text-[#E06C46] transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            <span>
              {isPro ? (
                <strong className="text-[#D36A48] font-black">Pro Unlimited</strong>
              ) : (
                <>
                  <strong className="text-[#14100D] dark:text-[#FAF6F0] font-black">{remainingCredits}</strong> free left
                </>
              )}
            </span>
          </Link>
        )}

        {/* Notification Bell with Badge & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-10 h-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#221E19] shadow-[0_4px_10px_rgba(125,95,75,0.18),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-[#E2D7C8] dark:border-[#383027] flex items-center justify-center text-[#211A14] dark:text-[#FAF6F0] hover:text-[#D36A48] dark:hover:text-[#E06C46] transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D36A48] text-white text-[10px] font-black flex items-center justify-center shadow-sm pointer-events-none">
              {unreadCount}
            </span>
          )}

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 clay-card p-4 shadow-2xl z-50 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAE0D4] dark:border-[#352E26]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#14100D] dark:text-[#FAF6F0]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-bold text-[#D36A48] dark:text-[#E06C46] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl text-xs transition ${
                      n.read
                        ? "bg-[#F7F2EA] dark:bg-[#181512] text-[#574B3F] dark:text-[#8C8072]"
                        : "bg-[#FDF1EC] dark:bg-[#2A1510] text-[#14100D] dark:text-[#FAF6F0] border border-[#F0BCAE] dark:border-[#4F2318]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black">{n.title}</p>
                      <span className="text-[10px] font-semibold text-[#8C8072] shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Circle */}
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-2xl bg-[#9ECBB9] dark:bg-[#204938] shadow-[0_4px_10px_rgba(100,150,130,0.40),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-[#7BB49F] dark:border-[#346F56] flex items-center justify-center text-[#092418] dark:text-[#D3F5E6] hover:scale-105 transition-transform"
          title={user?.email}
        >
          <User className="w-5 h-5" />
        </Link>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-start p-4 animate-in fade-in duration-200">
          <div className="w-72 bg-[#9DBEB1] dark:bg-[#162B21] rounded-3xl p-5 shadow-2xl flex flex-col justify-between border border-white/40 dark:border-white/10 transition-colors duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/30 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#D36A48]" />
                  <span className="font-black text-[#0C1E17] dark:text-[#E8F7F0]">flayre.ai</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-[#0C1E17] dark:text-[#E8F7F0] hover:bg-white/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {[
                  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { href: "/analyze", label: "Analyze", icon: Sparkles },
                  { href: "/history", label: "History", icon: History },
                  { href: "/pricing", label: "Pricing", icon: CreditCard },
                ].map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition ${
                        active
                          ? "clay-nav-active"
                          : "clay-nav-inactive"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/30 dark:border-white/10 space-y-3">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-white/30 dark:bg-white/10 text-[#0C1E17] dark:text-[#E8F7F0] rounded-xl transition"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full clay-btn clay-btn-secondary text-xs py-2 font-bold"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
