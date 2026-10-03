"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useProUpgrade } from "@/hooks/useProUpgrade";
import { useToast } from "@/components/Toast";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { SubscriptionInfo } from "@/types";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const { loading, error, success, handleUpgrade, clearError, clearSuccess } = useProUpgrade({
    redirectPath: "/pricing",
  });

  useEffect(() => {
    if (isAuthenticated) {
      api.billing.getSubscription().then(setSubscription).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      clearError();
    }
    if (success) {
      showToast(success, "success");
      clearSuccess();
    }
  }, [error, success, showToast, clearError, clearSuccess]);

  const isPro = subscription?.is_pro || false;
  const remaining = subscription?.usage.analyses_remaining ?? 10;

  return (
    <div className="min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text-primary)] flex flex-col lg:flex-row max-w-[1600px] mx-auto">
      {/* Left Sage Sidebar if Authenticated */}
      {isAuthenticated && (
        <div className="hidden lg:flex shrink-0">
          <Sidebar remainingCredits={remaining} isPro={isPro} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Navbar
          title="Pricing Plans"
          remainingCredits={isAuthenticated ? remaining : undefined}
          isPro={isAuthenticated ? isPro : undefined}
        />

        <main className="px-4 sm:px-6 space-y-12 flex-1 max-w-5xl mx-auto w-full pt-4">
          {/* Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="clay-badge clay-badge-terracotta">Simple & Transparent</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14100D] dark:text-[#FAF6F0] tracking-normal leading-snug">
              Start Free. Upgrade for Unlimited.
            </h1>
            <p className="text-xs sm:text-sm text-[#4A3E33] dark:text-[#B5A593] font-bold">
              No confusing tiers. Keep texting with 10 free monthly analyses, or unlock unlimited responses with Pro.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#40352B] dark:text-[#B5A593]">
                    Starter Plan
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#14100D] dark:text-[#FAF6F0]">$0</span>
                    <span className="text-xs font-bold text-[#574B3F] dark:text-[#A09282]">/ forever</span>
                  </div>
                  <p className="text-xs font-bold text-[#4A3E33] dark:text-[#B5A593]">
                    Ideal for casual texting and occasional advice.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EAE0D4] dark:border-[#352E26] space-y-3 text-xs text-[#211A14] dark:text-[#EAE1D5] font-bold">
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-sage w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#07261A] dark:text-[#6EE7B7]" />
                    </div>
                    <span><strong className="text-[#14100D] dark:text-[#FAF6F0]">10 analyses</strong> every month</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-sage w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#07261A] dark:text-[#6EE7B7]" />
                    </div>
                    <span>All 3 response tones (Warm, Direct, Playful)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-sage w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#07261A] dark:text-[#6EE7B7]" />
                    </div>
                    <span>Instant clipboard paste & 1-click copy</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-sage w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#07261A] dark:text-[#6EE7B7]" />
                    </div>
                    <span>Standard Vision AI processing speed</span>
                  </div>
                </div>
              </div>

              <Link href="/analyze" className="clay-btn clay-btn-secondary w-full text-xs py-3 text-center font-black">
                Continue with Free
              </Link>
            </div>

            {/* Pro Tier (Tactile Terracotta Clay from Reference) */}
            <div className="clay-card-terracotta p-6 sm:p-8 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 right-6 px-3.5 py-0.5 rounded-full text-[11px] font-black bg-[#D36A48] text-white shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#732916] dark:text-[#F3987A]">
                      flayre Pro
                    </span>
                    <Crown className="w-4 h-4 text-[#D36A48] fill-current" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#210D07] dark:text-[#FAF6F0]">$9.99</span>
                    <span className="text-xs font-bold text-[#541D0E] dark:text-[#E8A590]">/ month</span>
                  </div>
                  <p className="text-xs font-bold text-[#4D1B0F] dark:text-[#E0C0B4]">
                    Unlimited analyses for power texters and daters.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F0D5CB] dark:border-[#52291E] space-y-3 text-xs text-[#210D07] dark:text-[#FAF6F0] font-bold">
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-terracotta w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#4A1204] dark:text-[#FCA5A5]" />
                    </div>
                    <span><strong className="text-[#14100D] dark:text-white">Unlimited analyses</strong> (zero monthly caps)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-terracotta w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#4A1204] dark:text-[#FCA5A5]" />
                    </div>
                    <span>Priority GPU queue processing</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-terracotta w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#4A1204] dark:text-[#FCA5A5]" />
                    </div>
                    <span>Complete conversation history storage & search</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-terracotta w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#4A1204] dark:text-[#FCA5A5]" />
                    </div>
                    <span>Deep subtext & emotional state detection</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="clay-tile clay-tile-terracotta w-5 h-5 shrink-0">
                      <Check className="w-3 h-3 text-[#4A1204] dark:text-[#FCA5A5]" />
                    </div>
                    <span>Cancel anytime with 1-click in dashboard</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="clay-btn clay-btn-primary w-full text-xs py-3.5 font-bold inline-flex items-center justify-center gap-2 rounded-2xl shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Connecting Checkout...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>{isAuthenticated ? "Upgrade to Pro" : "Get Started with Pro"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* FAQ Clay Card */}
          <div className="clay-card p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-black text-[#14100D] dark:text-[#FAF6F0] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#D36A48]" />
              <span>Frequently Asked Questions</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-1">
                <h3 className="font-black text-[#14100D] dark:text-[#FAF6F0] text-sm">Can I cancel anytime?</h3>
                <p className="font-bold text-[#3B3026] dark:text-[#B5A593]">Yes. You can cancel with a single click in your dashboard settings. You retain access until the end of your billing cycle.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-[#14100D] dark:text-[#FAF6F0] text-sm">Are screenshots saved permanently?</h3>
                <p className="font-bold text-[#3B3026] dark:text-[#B5A593]">No. Screenshots are processed transiently in memory for Vision AI analysis and are never saved to disk or sold.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-[#14100D] dark:text-[#FAF6F0] text-sm">Which messaging apps work?</h3>
                <p className="font-bold text-[#3B3026] dark:text-[#B5A593]">WhatsApp, Instagram Direct, Discord, iMessage, Telegram, and standard SMS. Any clear screenshot works.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-[#14100D] dark:text-[#FAF6F0] text-sm">What payment methods are supported?</h3>
                <p className="font-bold text-[#3B3026] dark:text-[#B5A593]">All major Credit Cards, Debit Cards, UPI, and Net Banking are securely processed through Razorpay.</p>
              </div>
            </div>
          </div>
        </main>

        {!isAuthenticated && <Footer />}
      </div>
    </div>
  );
}
