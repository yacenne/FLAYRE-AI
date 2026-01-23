"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    full_name?: string;
}

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
    const [user, setUser] = useState<User | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login");
            return;
        }

        setUser(JSON.parse(userData));
        fetchData(token);
    }, [router]);

    const fetchData = async (token: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
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

    if (loading) {
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
                        <a
                            href="#"
                            className="btn bg-white text-purple-600 hover:bg-neutral-100 w-full"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 4.068 2.012 7.662 5.093 9.838A12.006 12.006 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10 0 2.282-.762 4.385-2.047 6.073l-8.026-8.026A4 4 0 0 0 8 12a4 4 0 0 0 4 4c.928 0 1.784-.316 2.463-.846l1.415 1.415A5.98 5.98 0 0 1 12 18a6 6 0 1 1 0-12 6 6 0 0 1 4.243 1.757l-1.414 1.414A4 4 0 0 0 12 8a4 4 0 0 0 0 8 4.002 4.002 0 0 0 3.465-2H12v-2h6v1a6 6 0 0 1-.34 2l5.393 5.393A9.97 9.97 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            Add to Chrome
                        </a>
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
        </div>
    );
}
