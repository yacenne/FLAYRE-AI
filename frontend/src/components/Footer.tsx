import Link from "next/link";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#DCD0C1] dark:border-[#2A231D] bg-[#EFE9DF]/90 dark:bg-[#141210]/95 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D36A48] to-[#E5BF67] flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base tracking-tight text-[#14100D] dark:text-[#FAF6F0]">
              flayre<span className="text-[#D36A48]">.ai</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs font-bold text-[#3B3026] dark:text-[#B5A593]">
            <Link href="/pricing" className="hover:text-[#000000] dark:hover:text-[#FAF6F0] transition">
              Pricing
            </Link>
            <Link href="/analyze" className="hover:text-[#000000] dark:hover:text-[#FAF6F0] transition">
              Analyze
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#000000] dark:hover:text-[#FAF6F0] transition"
            >
              GitHub
            </a>
            <span className="text-[#B5A593] dark:text-[#524538]">•</span>
            <span>Privacy First — No chat history stored permanently</span>
          </div>

          {/* Copyright */}
          <p className="text-xs font-bold text-[#4D4034] dark:text-[#8E7E70]">
            © {new Date().getFullYear()} flayre.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
