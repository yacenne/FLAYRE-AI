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
  Zap,
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
      title: "Welcome to flayre.ai",
      message: "10 free AI analyses are active in your account this month.",
      time: "Just now",
      read: false,
    },
    {
      id: "2",
      title: "Vision Model v2.0 Ready",
      message: "High-speed OCR & sentiment subtext engine ready.",
      time: "10m ago",
      read: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);

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
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#FF5238] flex items-center justify-center shadow-md shadow-[#FF5238]/20 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              flayre<span className="text-[#FF5238]">.ai</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#demo" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#features" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Features
            </a>
            <Link href="/pricing" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {isAuthenticated ? (
              <Link href="/dashboard" className="clay-btn-primary text-xs sm:text-sm py-2 px-4">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="clay-btn-secondary text-xs sm:text-sm py-2 px-3.5">
                  Sign In
                </Link>
                <Link href="/login" className="clay-btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Authenticated Top Bar
  return (
    <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Page Title & Mobile Drawer Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {title && (
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF5238] focus:bg-white transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 border border-slate-300/60 dark:border-slate-600">
            ⌘K
          </kbd>
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 transition shadow-sm"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Remaining Credits Pill */}
        {remainingCredits !== undefined && remainingCredits !== null && (
          <Link
            href="/pricing"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {isPro ? (
                <strong className="text-amber-600 dark:text-amber-400 font-bold">Pro Active</strong>
              ) : (
                <>
                  <strong className="text-slate-900 dark:text-white font-bold">{remainingCredits}</strong> credits left
                </>
              )}
            </span>
          </Link>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 transition shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5238] text-white text-[10px] font-bold flex items-center justify-center shadow-md pointer-events-none">
              {unreadCount}
            </span>
          )}

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-88 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-[#FF5238] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl text-xs transition ${
                      n.read
                        ? "bg-slate-50 dark:bg-slate-800/40 text-slate-500"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
          title={user?.email}
        >
          <User className="w-4 h-4" />
        </Link>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-start p-4 animate-in fade-in duration-200">
          <div className="w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5238] flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">flayre.ai</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
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
                      className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition ${
                        active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-l-2 border-[#FF5238]"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full clay-btn-secondary text-xs py-2 font-semibold"
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
