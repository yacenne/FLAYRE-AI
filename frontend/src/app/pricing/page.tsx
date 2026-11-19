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
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row max-w-[1600px] mx-auto transition-colors duration-200">
      {/* Sidebar if Authenticated */}
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

        <main className="px-4 sm:px-6 space-y-10 flex-1 max-w-5xl mx-auto w-full pt-4 sm:pt-8">
          {/* Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="clay-badge-terracotta">Simple Pricing</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              Start free. Upgrade for unlimited.
            </h1>
            <p className="text-sm text-slate-500">
              No complicated tiers. Enjoy 10 free monthly analyses, or supercharge your texting with Pro.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Free Starter Tier */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 shadow-sm">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Starter Plan
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$0</span>
                    <span className="text-xs text-slate-500">/ forever</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ideal for casual texters and occasional conversation advice.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong className="text-slate-900 dark:text-white">10 free analyses</strong> every month</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All 3 response tones (Warm, Direct, Playful)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant clipboard paste & 1-click copy</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard Vision AI OCR processing</span>
                  </div>
                </div>
              </div>

              <Link
                href="/analyze"
                className="clay-btn-secondary w-full text-xs py-3 text-center font-bold rounded-xl"
              >
                Continue with Starter
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between space-y-6 relative bg-white dark:bg-slate-900 border-2 border-[#FF5238] shadow-md">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FF5238] text-white shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#FF5238] font-bold">
                      flayre Pro
                    </span>
                    <Crown className="w-4 h-4 text-amber-500 fill-current" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$9.99</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Unlimited power for active texters, professionals, and daters.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-slate-700 dark:text-slate-200 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF5238] shrink-0" />
                    <span><strong className="text-slate-950 dark:text-white font-bold">Unlimited analyses</strong> (zero monthly caps)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF5238] shrink-0" />
                    <span>Priority GPU queue processing (&lt; 2s response)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF5238] shrink-0" />
                    <span>Complete conversation history archival & search</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF5238] shrink-0" />
                    <span>Advanced subtext & psychological tone breakdown</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF5238] shrink-0" />
                    <span>Cancel anytime with 1-click in dashboard</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="clay-btn-primary w-full text-xs py-3.5 font-bold inline-flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Opening Checkout...</span>
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

          {/* FAQ Card */}
          <div className="clay-card p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#FF5238]" />
              <span>Frequently Asked Questions</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-500">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Can I cancel anytime?</h3>
                <p>Yes. You can cancel with a single click in your dashboard settings anytime. You retain full access until the end of your billing cycle.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Are screenshots saved permanently?</h3>
                <p>No. Screenshots are processed transiently in memory for Vision AI analysis and are immediately deleted. Never stored or shared.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Which messaging apps work?</h3>
                <p>WhatsApp, Instagram Direct, Discord, iMessage, Tinder, Bumble, Telegram, and standard SMS. Any clear screenshot works seamlessly.</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">What payment methods are supported?</h3>
                <p>All major Credit Cards, Debit Cards, UPI, and Net Banking are securely processed through Razorpay.</p>
              </div>
            </div>
          </div>
        </main>

        {!isAuthenticated && <Footer />}
      </div>
    </div>
  );
}
