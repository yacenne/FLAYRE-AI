"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, getAccessToken } from "@/context/AuthContext";

interface Subscription {
    plan_type: string;
    is_pro: boolean;
    usage: {
        analyses_used: number;
        analyses_limit: number;
        analyses_remaining: number;
    };
}

interface Conversation {
    id: string;
    platform: string;
    context_summary: string;
    detected_tone: string;
    created_at: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInstallModal, setShowInstallModal] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login?redirect=/dashboard");
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = getAccessToken();

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Fetch subscription
            const subRes = await fetch(`${apiUrl}/api/v1/billing/subscription`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (subRes.ok) {
                setSubscription(await subRes.json());
            }

            // Fetch conversations
            const convRes = await fetch(`${apiUrl}/api/v1/conversations?per_page=5`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (convRes.ok) {
                const data = await convRes.json();
                setConversations(data.items || []);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const getPlatformEmoji = (platform: string) => {
        const emojis: Record<string, string> = {
            whatsapp: "💬",
            instagram: "📸",
            discord: "🎮",
            other: "💭",
        };
        return emojis[platform.toLowerCase()] || "💭";
    };

    // Show loading while checking auth
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center animate-pulse mx-auto mb-4">
                        <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-neutral-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                                <span className="text-xl">🔥</span>
                            </div>
                            <span className="text-xl font-bold text-neutral-900">flayre.ai</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <span className="text-neutral-600">{user?.email}</span>
                            <button onClick={handleLogout} className="btn btn-ghost text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Welcome back{user?.full_name ? `, ${user.full_name}` : ""}! 👋
                    </h1>
                    <p className="text-neutral-600">
                        Ready to craft the perfect response? Here's your dashboard.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Usage Card */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-neutral-600">Analyses Used</span>
                            {subscription?.is_pro && (
                                <span className="badge badge-pro text-xs">PRO</span>
                            )}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-neutral-900">
                                {subscription?.usage.analyses_used || 0}
                            </span>
                            <span className="text-neutral-500 mb-1">
                                / {subscription?.is_pro ? "∞" : subscription?.usage.analyses_limit || 10}
                            </span>
                        </div>
                        {!subscription?.is_pro && (
                            <div className="mt-4">
                                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-hero rounded-full"
                                        style={{
                                            width: `${Math.min(
                                                ((subscription?.usage.analyses_used || 0) /
                                                    (subscription?.usage.analyses_limit || 10)) *
                                                100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-sm text-neutral-500 mt-2">
                                    {subscription?.usage.analyses_remaining || 0} remaining this month
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Plan Card */}
                    <div className="card">
                        <span className="text-neutral-600 block mb-4">Current Plan</span>
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${subscription?.is_pro
                                    ? "bg-gradient-hero text-white"
                                    : "bg-neutral-100"
                                    }`}
                            >
                                {subscription?.is_pro ? "⭐" : "🆓"}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-neutral-900 capitalize">
                                    {subscription?.plan_type || "Free"}
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {subscription?.is_pro ? "Unlimited analyses" : "10 analyses/month"}
                                </p>
                            </div>
                        </div>
                        {!subscription?.is_pro && (
                            <Link href="/pricing" className="btn btn-primary w-full mt-4">
                                Upgrade to Pro
                            </Link>
                        )}
                    </div>

                    {/* Quick Action Card */}
                    <div className="card bg-gradient-to-br from-purple-600 to-pink-500 border-0">
                        <span className="text-white/80 block mb-4">Quick Start</span>
                        <p className="text-xl font-bold text-white mb-2">
                            Install Extension
                        </p>
                        <p className="text-white/80 text-sm mb-4">
                            Get the Chrome extension for one-click analysis
                        </p>
                        <button
                            onClick={() => setShowInstallModal(true)}
                            className="btn bg-white text-purple-600 hover:bg-neutral-100 w-full flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 4.068 2.012 7.662 5.093 9.838A12.006 12.006 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10 0 2.282-.762 4.385-2.047 6.073l-8.026-8.026A4 4 0 0 0 8 12a4 4 0 0 0 4 4c.928 0 1.784-.316 2.463-.846l1.415 1.415A5.98 5.98 0 0 1 12 18a6 6 0 1 1 0-12 6 6 0 0 1 4.243 1.757l-1.414 1.414A4 4 0 0 0 12 8a4 4 0 0 0 0 8 4.002 4.002 0 0 0 3.465-2H12v-2h6v1a6 6 0 0 1-.34 2l5.393 5.393A9.97 9.97 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            Add to Chrome
                        </button>
                    </div>
                </div>

                {/* Recent Conversations */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-neutral-900">Recent Analyses</h2>
                        <Link href="/history" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                            View All →
                        </Link>
                    </div>

                    {conversations.length > 0 ? (
                        <div className="space-y-4">
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                                        {getPlatformEmoji(conv.platform)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-neutral-900 capitalize">
                                                {conv.platform}
                                            </span>
                                            <span className="badge badge-primary text-xs capitalize">
                                                {conv.detected_tone || "neutral"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-600 truncate">
                                            {conv.context_summary || "Conversation analysis"}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            {new Date(conv.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-3xl mx-auto mb-4">
                                💬
                            </div>
                            <p className="text-neutral-600 mb-2">No analyses yet</p>
                            <p className="text-sm text-neutral-500">
                                Install the extension and analyze your first conversation!
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Install Extension Modal */}
            {showInstallModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-neutral-900">Install Extension</h3>
                            <button
                                onClick={() => setShowInstallModal(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">1</div>
                                <div>
                                    <p className="font-medium text-neutral-900">Download the extension</p>
                                    <p className="text-sm text-neutral-600">The extension folder is in the project repository</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">2</div>
                                <div>
                                    <p className="font-medium text-neutral-900">Open Chrome Extensions</p>
                                    <p className="text-sm text-neutral-600">Go to <code className="bg-neutral-100 px-1 rounded">chrome://extensions</code></p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">3</div>
                                <div>
                                    <p className="font-medium text-neutral-900">Enable Developer Mode</p>
                                    <p className="text-sm text-neutral-600">Toggle it on in the top right corner</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">4</div>
                                <div>
                                    <p className="font-medium text-neutral-900">Load the extension</p>
                                    <p className="text-sm text-neutral-600">Click "Load unpacked" and select the extension folder</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowInstallModal(false)}
                            className="btn btn-primary w-full mt-6"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
