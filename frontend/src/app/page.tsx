"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatShowcase } from "@/components/ChatShowcase";
import {
  Sparkles,
  ArrowRight,
  Eye,
  ShieldCheck,
  Zap,
  Layers,
  Heart,
  Smile,
  Flame,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col relative selection:bg-[#FF5238]/20 selection:text-[#FF5238]">
      {/* Subtle top glow */}
      <div className="simple-hero-glow" />

      <Navbar />

      {/* Authenticated user top banner */}
      {isAuthenticated && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 flex items-center justify-center gap-2">
          <span>Signed in as <strong>{user?.email}</strong></span>
          <span className="text-orange-300">•</span>
          <Link
            href="/dashboard"
            className="text-[#FF5238] hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>Open your Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <main className="flex-1 relative z-10">
        {/* ============================================================================ */}
        {/* Hero Section */}
        {/* ============================================================================ */}
        <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF5238]" />
              <span className="text-slate-900 font-bold">Vision AI 2.0</span>
              <span className="text-slate-300">•</span>
              <span>Intelligent Screenshot Analysis</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 leading-[1.15]">
              Never wonder{" "}
              <span className="text-gradient-flame">what to text</span> next.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Drop or paste any chat screenshot. Our multimodal AI reads the subtext, emotional tension, and conversational rhythm to suggest the ideal response.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="clay-btn-primary py-3 px-7 text-sm font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-md"
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                  <Link
                    href="/analyze"
                    className="clay-btn-secondary py-3 px-6 text-sm font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#FF5238]" />
                    <span>Analyze Screenshot</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/analyze"
                    className="clay-btn-primary py-3 px-7 text-sm font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Start Free Analysis</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                  <a
                    href="#demo"
                    className="clay-btn-secondary py-3 px-6 text-sm font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2"
                  >
                    <span>Try Interactive Demo</span>
                  </a>
                </>
              )}
            </div>

            {/* Trust Micro-Text */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                10 Free Analyses / Month
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                WhatsApp, Instagram, iMessage
              </span>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* Interactive AI Showcase */}
          {/* ============================================================================ */}
          <div id="demo" className="mt-12 sm:mt-16">
            <ChatShowcase />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* Simple 3-step loop */}
        {/* ============================================================================ */}
        <section id="how-it-works" className="py-20 border-t border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
              <span className="clay-badge-terracotta">Simple Workflow</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Ready in three simple steps
              </h2>
              <p className="text-sm text-slate-500">
                From awkward screenshot to confident reply in under 5 seconds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Drop or Paste Screenshot",
                  desc: "Take a screenshot on WhatsApp, Instagram, or iMessage and press Ctrl+V to paste instantly.",
                },
                {
                  step: "02",
                  title: "AI Decodes Context",
                  desc: "Vision AI evaluates participant cues, subtext, emotional tension, and urgency automatically.",
                },
                {
                  step: "03",
                  title: "Pick Tone & Send",
                  desc: "Select Warm, Direct, or Playful. Copy with one click and reply with complete confidence.",
                },
              ].map((item, idx) => (
                <div key={idx} className="clay-card p-6 space-y-3 bg-white hover:border-slate-300 transition-all duration-150">
                  <span className="text-xs font-mono font-bold text-[#FF5238] block">{item.step}</span>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================================ */}
        {/* Features / Capabilities */}
        {/* ============================================================================ */}
        <section id="features" className="py-20 border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <span className="clay-badge-sage">Capabilities</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Engineered for natural human conversation
              </h2>
              <p className="text-sm text-slate-500">
                Beyond naive OCR. flayre.ai processes visual nuances, emoji context, reply delays, and conversational tension.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: Eye,
                  color: "clay-tile-terracotta",
                  title: "Multimodal Vision OCR",
                  desc: "Analyzes full chat screenshots including sticker reactions, bubble layout, and emoji subtext.",
                },
                {
                  icon: Layers,
                  color: "clay-tile-sage",
                  title: "3 Calibrated Tones",
                  desc: "Get Warm (empathetic), Direct (straightforward), and Playful (witty) replies instantly.",
                },
                {
                  icon: Zap,
                  color: "clay-tile-denim",
                  title: "Instant Clipboard Flow",
                  desc: "Hit Ctrl+V directly anywhere to paste a screenshot and get replies in under 3 seconds.",
                },
                {
                  icon: ShieldCheck,
                  color: "clay-tile-honey",
                  title: "Ephemeral Privacy",
                  desc: "Screenshots are processed in transient memory and immediately wiped. Never stored.",
                },
              ].map((feat, idx) => (
                <div key={idx} className="clay-card p-6 space-y-3.5 bg-white hover:border-slate-300 transition-all duration-150">
                  <div className={`clay-tile ${feat.color} w-10 h-10`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================================ */}
        {/* Bottom CTA Banner */}
        {/* ============================================================================ */}
        <section className="py-20 border-t border-slate-100 bg-slate-50/50 text-center px-4 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-5 relative z-10 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Ready to elevate your conversation confidence?
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Start with 10 free AI analyses each month. No credit card required.
            </p>
            <div className="pt-2">
              <Link
                href="/analyze"
                className="clay-btn-primary py-3.5 px-8 text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md"
              >
                <span>Start Free Analysis</span>
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
