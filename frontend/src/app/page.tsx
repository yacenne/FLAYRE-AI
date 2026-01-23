"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================
// Header Component
// ============================================
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <span className="text-xl font-bold text-white">flayre.ai</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-neutral-300 hover:text-white transition">
              Features
            </a>
            <a href="#how-it-works" className="text-neutral-300 hover:text-white transition">
              How It Works
            </a>
            <a href="#pricing" className="text-neutral-300 hover:text-white transition">
              Pricing
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-white hover:text-primary-300 transition font-medium">
              Sign In
            </Link>
            <Link href="/login" className="btn btn-primary">
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-neutral-300 hover:text-white">Features</a>
              <a href="#how-it-works" className="text-neutral-300 hover:text-white">How It Works</a>
              <a href="#pricing" className="text-neutral-300 hover:text-white">Pricing</a>
              <Link href="/login" className="btn btn-primary w-full mt-2">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// ============================================
// Hero Section
// ============================================
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-dark overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float delay-200" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float delay-400" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6 animate-fade-in-up">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-neutral-300">Powered by Vision AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in-up delay-100">
              Never Know
              <br />
              <span className="text-gradient">What to Say?</span>
              <br />
              We've Got You.
            </h1>

            <p className="text-lg sm:text-xl text-neutral-300 mb-8 max-w-xl animate-fade-in-up delay-200">
              AI-powered conversation assistant that analyzes your chat screenshots and suggests
              <strong className="text-white"> perfect responses</strong> for any situation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-300">
              <Link href="/login" className="btn btn-primary btn-lg">
                <span>Start Free Trial</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                See How It Works
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start animate-fade-in-up delay-400">
              <div className="flex -space-x-3">
                {["👩‍💼", "👨‍💻", "👩‍🎨", "👨‍🔬"].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg border-2 border-neutral-900">
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-neutral-400">Loved by 2,000+ users</p>
              </div>
            </div>
          </div>

          {/* Right - Demo Preview */}
          <div className="relative animate-fade-in-up delay-300">
            <div className="relative">
              {/* Phone Mockup */}
              <div className="bg-neutral-800 rounded-3xl p-2 shadow-2xl mx-auto max-w-sm animate-float">
                <div className="bg-neutral-900 rounded-2xl p-4 min-h-[500px]">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-neutral-700">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg">
                      😊
                    </div>
                    <div>
                      <p className="text-white font-medium">Sarah</p>
                      <p className="text-xs text-green-400">Online</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="py-4 space-y-3">
                    <div className="flex justify-start">
                      <div className="bg-neutral-700 rounded-2xl rounded-tl-md px-4 py-2 max-w-[80%]">
                        <p className="text-white text-sm">Hey! Are you coming to the party tonight? 🎉</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-neutral-700 rounded-2xl rounded-tl-md px-4 py-2 max-w-[80%]">
                        <p className="text-white text-sm">It's going to be so much fun!</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-purple-600 rounded-2xl rounded-tr-md px-4 py-2 max-w-[80%]">
                        <p className="text-white text-sm">I'd love to! What time does it start?</p>
                      </div>
                    </div>
                  </div>

                  {/* Response Suggestions */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-neutral-400 uppercase tracking-wide">AI Suggestions</p>
                    {[
                      { emoji: "💜", text: "Absolutely! Can't wait to see everyone there!", tone: "Warm" },
                      { emoji: "✨", text: "Count me in! Should I bring anything?", tone: "Direct" },
                      { emoji: "🎊", text: "Party time! You know I never miss a good one 😎", tone: "Playful" },
                    ].map((suggestion, i) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3 border border-neutral-700 hover:border-purple-500 transition cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-purple-400 font-medium">{suggestion.tone}</span>
                          <span className="text-lg">{suggestion.emoji}</span>
                        </div>
                        <p className="text-white text-sm mt-1">{suggestion.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-hero rounded-full px-4 py-2 shadow-lg animate-pulse-glow">
                <span className="text-white font-semibold text-sm">✨ AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-neutral-500 text-sm">Scroll to explore</span>
        <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

// ============================================
// Features Section
// ============================================
function FeaturesSection() {
  const features = [
    {
      icon: "👁️",
      title: "Vision AI Analysis",
      description: "Our AI sees everything - text, emojis, GIFs, reactions, and images. Full context understanding."
    },
    {
      icon: "💬",
      title: "3 Response Styles",
      description: "Get warm, direct, and playful suggestions. Pick the tone that matches your vibe."
    },
    {
      icon: "⚡",
      title: "Instant Results",
      description: "Screenshot → Analyze → Respond. Get suggestions in seconds, not minutes."
    },
    {
      icon: "🔒",
      title: "Privacy First",
      description: "Your screenshots are processed and deleted immediately. We never store your conversations."
    },
    {
      icon: "🌐",
      title: "Works Everywhere",
      description: "WhatsApp, Instagram, Discord, iMessage, Telegram - any chat platform works."
    },
    {
      icon: "📱",
      title: "Chrome Extension",
      description: "One-click screenshot capture. Zero friction workflow for faster replies."
    },
  ];

  return (
    <section id="features" className="py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="badge badge-primary mb-4">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Everything You Need to
            <span className="text-gradient"> Never Be Stuck Again</span>
          </h2>
          <p className="text-lg text-neutral-600">
            Powered by advanced Vision AI that understands the full context of your conversations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="card group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-neutral-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// How It Works Section
// ============================================
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Capture Screenshot",
      description: "Click the flayre extension or take a screenshot of any chat conversation.",
      icon: "📸"
    },
    {
      step: "02",
      title: "AI Analyzes Everything",
      description: "Vision AI reads text, emojis, GIFs, images, tone, and relationship context.",
      icon: "🤖"
    },
    {
      step: "03",
      title: "Get Smart Suggestions",
      description: "Receive 3 perfectly crafted responses in different tones. Copy and paste!",
      icon: "✨"
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="badge badge-primary mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Three Simple Steps to
            <span className="text-gradient"> Better Conversations</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-purple-300 to-pink-300" />
              )}

              {/* Step Number */}
              <div className="relative inline-flex">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition shadow-lg">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-hero text-white font-bold flex items-center justify-center text-sm">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2">{step.title}</h3>
              <p className="text-neutral-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Pricing Section
// ============================================
function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="badge badge-pro mb-4">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Free, Upgrade When You're Ready
          </h2>
          <p className="text-lg text-neutral-300">
            Try flayre.ai risk-free. No credit card required for free tier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="card bg-neutral-800 border-neutral-700">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-neutral-400">/forever</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "10 analyses per month",
                "All 3 response tones",
                "Chrome extension access",
                "Basic conversation history",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-neutral-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/login" className="btn btn-secondary w-full">
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="card bg-gradient-to-br from-purple-600 to-pink-500 border-0 relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">Most Popular</span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$9.99</span>
                <span className="text-white/70">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited analyses",
                "Priority AI processing",
                "Full conversation history",
                "Advanced context detection",
                "Export & share responses",
                "Email support",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white">
                  <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/login?plan=pro" className="btn bg-white text-purple-600 hover:bg-neutral-100 w-full font-bold">
              Start Pro Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA Section
// ============================================
function CTASection() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          Ready to Never Be
          <span className="text-gradient"> Stuck Again?</span>
        </h2>
        <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already having better conversations.
          Start for free, no credit card required.
        </p>
        <Link href="/login" className="btn btn-primary btn-lg">
          Get Started Free
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

// ============================================
// Footer
// ============================================
function Footer() {
  return (
    <footer className="bg-neutral-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-sm">🔥</span>
            </div>
            <span className="text-white font-bold">flayre.ai</span>
          </div>

          <div className="flex items-center gap-6 text-neutral-400 text-sm">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>

          <p className="text-neutral-500 text-sm">
            © 2025 flayre.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}