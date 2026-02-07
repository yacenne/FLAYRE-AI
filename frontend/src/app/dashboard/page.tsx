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
                            Analyze Now
                        </p>
                        <p className="text-white/80 text-sm mb-4">
                            Upload or paste a screenshot to get AI-powered suggestions
                        </p>
                        <Link
                            href="/analyze"
                            className="btn bg-white text-purple-600 hover:bg-neutral-100 w-full flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">✨</span>
                            Start Analysis
                        </Link>
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
                            <p className="text-sm text-neutral-500 mb-4">
                                Upload a screenshot to analyze your first conversation!
                            </p>
                            <Link href="/analyze" className="btn btn-primary">
                                ✨ Start Your First Analysis
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
