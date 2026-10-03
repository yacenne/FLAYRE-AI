import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CeramicStudioConsole } from "@/components/CeramicStudioConsole";
import {
  Sparkles,
  ArrowRight,
  Eye,
  ShieldCheck,
  Zap,
  Layers,
  Heart,
  Smile,
  Play,
  Flame,
  Headphones,
  Camera,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text-primary)] flex flex-col selection:bg-[#D97757]/25 selection:text-[var(--clay-text-primary)]">
      <Navbar />

      <main className="flex-1">
        {/* ============================================================================ */}
        {/* Hero Section */}
        {/* ============================================================================ */}
        <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#D97757]/10 blur-[140px] pointer-events-none rounded-full" />

          <div className="relative text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#1C1916] shadow-[0_4px_10px_rgba(125,95,75,0.18),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.06)] border border-[#E2D7C8] dark:border-[#382F26] text-xs font-black text-[#29211A] dark:text-[#E8DFD1]">
              <span className="w-2 h-2 rounded-full bg-[#D36A48] animate-pulse" />
              <span>Vision AI Conversation Assistant</span>
            </div>

            {/* Headline with balanced word spacing & editorial touch */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.015em] [word-spacing:0.04em] text-[#14100D] dark:text-[#FAF6F0] leading-[1.22] max-w-4xl mx-auto">
              Never get stuck on <span className="text-[#D36A48] italic font-serif">what to text</span> next.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#3B3026] dark:text-[#B5A593] leading-relaxed font-medium max-w-2xl mx-auto [word-spacing:0.025em]">
              Drop or paste any chat screenshot. Our Vision AI decodes hidden subtext, mood, and relationship dynamics to generate the ideal responses in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link href="/analyze" className="clay-btn clay-btn-primary py-3.5 px-8 text-sm font-bold w-full sm:w-auto shadow-xl inline-flex items-center justify-center gap-2 rounded-full">
                <span>Start Free Analysis</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <a href="#features" className="clay-btn clay-btn-secondary py-3.5 px-7 text-sm font-bold w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full">
                <span>Explore Studio</span>
              </a>
            </div>

            <p className="text-xs font-bold text-[#574B3F] dark:text-[#8E7E70] pt-1">
              10 free analyses every month • No credit card required • Works on all chat apps
            </p>
          </div>

          {/* ============================================================================ */}
          {/* 3D Ceramic Studio Console (faithful to preview mockup) */}
          {/* ============================================================================ */}
          <div className="relative mt-12 sm:mt-16">
            <CeramicStudioConsole />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* Features Section */}
        {/* ============================================================================ */}
        <section id="features" className="py-20 border-t border-[#E8DFD3] dark:border-[#2A231D] bg-[#EFE9DE]/50 dark:bg-[#181512]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <span className="clay-badge clay-badge-sage">Capabilities</span>
              <h2 className="text-3xl font-extrabold text-[#14100D] dark:text-[#FAF6F0] tracking-normal">
                Designed for natural conversation
              </h2>
              <p className="text-xs sm:text-sm text-[#3B3026] dark:text-[#B5A593] font-bold">
                More than text extraction. flayre.ai processes visual nuances, reactions, and context.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: Eye,
                  color: "clay-tile-sage",
                  title: "Multimodal Vision AI",
                  desc: "Analyzes full screenshots including emojis, reactions, bubble placement, and tone.",
                },
                {
                  icon: Layers,
                  color: "clay-tile-terracotta",
                  title: "Three Dynamic Tones",
                  desc: "Receive Warm (empathetic), Direct (straightforward), and Playful (witty) replies.",
                },
                {
                  icon: Zap,
                  color: "clay-tile-denim",
                  title: "Clipboard Workflow",
                  desc: "Press Ctrl+V to paste your screenshot, get suggestions in 3 seconds, and copy with one click.",
                },
                {
                  icon: ShieldCheck,
                  color: "clay-tile-honey",
                  title: "Zero Retention",
                  desc: "Screenshots are processed transiently in-memory and are never stored or shared.",
                },
              ].map((feat, idx) => (
                <div key={idx} className="clay-card p-6 space-y-3">
                  <div className={`clay-tile ${feat.color} w-11 h-11`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[#14100D] dark:text-[#FAF6F0]">{feat.title}</h3>
                  <p className="text-xs text-[#3B3026] dark:text-[#B5A593] leading-relaxed font-bold">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================================ */}
        {/* How It Works Section */}
        {/* ============================================================================ */}
        <section id="how-it-works" className="py-20 border-t border-[#E8DFD3] dark:border-[#2A231D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
              <span className="clay-badge clay-badge-terracotta">Simple Workflow</span>
              <h2 className="text-3xl font-extrabold text-[#14100D] dark:text-[#FAF6F0] tracking-normal">How it works in 3 steps</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Upload or Paste",
                  desc: "Take a screenshot of WhatsApp, Instagram, or Discord and drop it or hit Ctrl+V.",
                },
                {
                  step: "02",
                  title: "Vision AI Reads Tone",
                  desc: "Our model reads the entire chat thread, mood, and emotional cues in seconds.",
                },
                {
                  step: "03",
                  title: "Pick & Send",
                  desc: "Choose the tone that matches your mood, copy the response, and reply effortlessly.",
                },
              ].map((item, idx) => (
                <div key={idx} className="clay-card p-6 space-y-3">
                  <span className="text-xs font-mono font-black text-[#D36A48]">{item.step}</span>
                  <h3 className="text-base font-black text-[#14100D] dark:text-[#FAF6F0]">{item.title}</h3>
                  <p className="text-xs text-[#3B3026] dark:text-[#B5A593] leading-relaxed font-bold">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================================ */}
        {/* CTA Banner */}
        {/* ============================================================================ */}
        <section className="py-16 border-t border-[#E8DFD3] dark:border-[#2A231D] bg-[#EFE9DF]/60 dark:bg-[#181512]/80 text-center px-4">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-normal text-[#14100D] dark:text-[#FAF6F0] leading-snug">
              Ready to elevate your texting confidence?
            </h2>
            <p className="text-xs sm:text-sm text-[#3B3026] dark:text-[#B5A593] font-bold">
              Start with 10 free analyses every month. No credit card required.
            </p>
            <div>
              <Link href="/analyze" className="clay-btn clay-btn-primary py-3.5 px-8 text-sm font-bold shadow-xl inline-flex items-center justify-center gap-2">
                <span>Start Analyzing Now</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}