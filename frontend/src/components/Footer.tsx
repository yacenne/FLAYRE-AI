import Link from "next/link";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FF5238] flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              flayre<span className="text-[#FF5238]">.ai</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/analyze" className="hover:text-slate-900 transition-colors">
              Analyze
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-400 font-normal">Privacy First — Screenshots analyzed in-memory only</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} flayre.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
