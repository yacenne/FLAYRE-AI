"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useProUpgrade } from "@/hooks/useProUpgrade";

export default function PricingPage() {
    const { isAuthenticated } = useAuth();
    const { loading, error, success, handleUpgrade, clearError, clearSuccess } = useProUpgrade({
        redirectPath: "/pricing",
    });

    return (
        <div className="min-h-screen bg-gradient-dark">
            {/* Header */}
            <header className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                                <span className="text-xl">🔥</span>
                            </div>
                            <span className="text-xl font-bold text-white">flayre.ai</span>
                        </Link>

                        {isAuthenticated ? (
                            <Link href="/dashboard" className="btn btn-primary">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="btn btn-primary">
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {/* Heading */}
                <div className="text-center mb-12">
                    <span className="badge badge-pro mb-4">Simple Pricing</span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Start Free, Scale When Ready
                    </h1>
                    <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
                        No hidden fees. Pay with Razorpay (UPI, Credit/Debit Cards, NetBanking).
                    </p>
                </div>

                {/* Accessible Notifications */}
                {error && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center justify-between"
                    >
                        <span>{error}</span>
                        <button
                            onClick={clearError}
                            aria-label="Dismiss error notification"
                            className="text-red-400 hover:text-red-200 font-bold text-lg ml-2"
                        >
                            ×
                        </button>
                    </div>
                )}
                {success && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="max-w-md mx-auto mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-300 text-sm font-medium flex items-center justify-between"
                    >
                        <span>{success}</span>
                        <button
                            onClick={clearSuccess}
                            aria-label="Dismiss success notification"
                            className="text-green-400 hover:text-green-200 font-bold text-lg ml-2"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Free Tier */}
                    <div className="card bg-neutral-800/50 border-neutral-700 flex flex-col justify-between">
                        <div>
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center text-2xl">
                                        🆓
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Free</h2>
                                        <p className="text-neutral-400">Perfect to get started</p>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-white">₹0</span>
                                    <span className="text-neutral-400">/forever</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    { text: "10 analyses per month", included: true },
                                    { text: "All 3 response tones", included: true },
                                    { text: "Chrome extension", included: true },
                                    { text: "Basic history (7 days)", included: true },
                                    { text: "Unlimited analyses", included: false },
                                    { text: "Priority processing", included: false },
                                    { text: "Email support", included: false },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        {item.included ? (
                                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                        <span className={item.included ? "text-neutral-300" : "text-neutral-500"}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Link href="/login" className="btn btn-secondary w-full text-center">
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro Tier */}
                    <div className="relative">
                        {/* Popular Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero rounded-full px-4 py-1.5 shadow-lg z-10">
                            <span className="text-white text-sm font-semibold">⭐ Most Popular</span>
                        </div>

                        <div className="card bg-gradient-to-br from-purple-600 to-pink-500 border-0 h-full flex flex-col justify-between">
                            <div>
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                                            ⭐
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Pro</h2>
                                            <p className="text-white/80">For power users</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-white">₹499</span>
                                        <span className="text-white/70">/month</span>
                                    </div>
                                </div>


                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Unlimited AI conversation analyses",
                                        "All 3 response tones (Warm, Direct, Playful)",
                                        "Chrome extension full access",
                                        "Full conversation history",
                                        "Priority AI processing",
                                        "Advanced context & emotion detection",
                                        "Direct Razorpay instant checkout",
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-white">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="btn bg-white text-purple-600 hover:bg-neutral-100 w-full font-bold shadow-lg disabled:opacity-50 transition cursor-pointer"
                            >
                                {loading ? "Opening Checkout..." : "Upgrade with Razorpay"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">
                        Frequently Asked Questions
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                q: "What payment methods do you accept via Razorpay?",
                                a: "Razorpay supports UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), NetBanking, and Wallets.",
                            },
                            {
                                q: "Can I cancel anytime?",
                                a: "Yes! You can manage or cancel your Pro subscription at any time with no lock-in contract.",
                            },
                            {
                                q: "Is my payment secure?",
                                a: "100% secure. Payments are processed through Razorpay's PCI-DSS Level 1 compliant gateway.",
                            },
                            {
                                q: "Do I need a credit card for the free tier?",
                                a: "No! The free tier is completely free with no payment method required.",
                            },
                        ].map((faq, i) => (
                            <div key={i} className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                                <p className="text-neutral-400 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-20 text-center">
                    <p className="text-neutral-400 mb-4">Still have questions?</p>
                    <a href="mailto:support@flayre.ai" className="text-purple-400 hover:text-purple-300 font-medium">
                        Contact us →
                    </a>
                </div>
            </main>
        </div>
    );
}
