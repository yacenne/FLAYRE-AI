"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, getAccessToken } from "@/context/AuthContext";

interface Conversation {
    id: string;
    platform: string;
    context_summary: string;
    detected_tone: string;
    relationship_type: string;
    created_at: string;
}

interface PaginationInfo {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

export default function HistoryPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login?redirect=/history");
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch conversations
    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations(currentPage);
        }
    }, [isAuthenticated, currentPage]);

    const fetchConversations = async (page: number) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = getAccessToken();

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/v1/conversations?page=${page}&per_page=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.items || []);
                setPagination({
                    page: data.page,
                    per_page: data.per_page,
                    total: data.total,
                    total_pages: data.total_pages,
                });
            } else {
                setError("Failed to load conversation history");
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
            setError("Failed to load conversation history");
        } finally {
            setLoading(false);
        }
    };

    const getPlatformEmoji = (platform: string) => {
        const emojis: Record<string, string> = {
            whatsapp: "💬",
            instagram: "📸",
            discord: "🎮",
            other: "💭",
        };
        return emojis[platform?.toLowerCase()] || "💭";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Loading state
    if (authLoading || (loading && conversations.length === 0)) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center animate-pulse mx-auto mb-4">
                        <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-neutral-600">Loading history...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-neutral-500 hover:text-neutral-700">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <h1 className="text-xl font-bold text-neutral-900">Conversation History</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={() => fetchConversations(currentPage)}
                            className="mt-4 btn btn-primary"
                        >
                            Try Again
                        </button>
                    </div>
                ) : conversations.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl">
                                            {getPlatformEmoji(conv.platform)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-neutral-900 capitalize">
                                                    {conv.platform || "Unknown"}
                                                </span>
                                                {conv.detected_tone && (
                                                    <span className="badge badge-primary text-xs capitalize">
                                                        {conv.detected_tone}
                                                    </span>
                                                )}
                                                {conv.relationship_type && (
                                                    <span className="badge bg-neutral-100 text-neutral-600 text-xs capitalize">
                                                        {conv.relationship_type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-neutral-600 line-clamp-2">
                                                {conv.context_summary || "Conversation analysis"}
                                            </p>
                                            <p className="text-sm text-neutral-400 mt-2">
                                                {formatDate(conv.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="btn btn-ghost disabled:opacity-50"
                                >
                                    ← Previous
                                </button>
                                <span className="text-neutral-600">
                                    Page {currentPage} of {pagination.total_pages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                                    disabled={currentPage >= pagination.total_pages}
                                    className="btn btn-ghost disabled:opacity-50"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-4xl mx-auto mb-6">
                            💬
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">No conversations yet</h2>
                        <p className="text-neutral-600 mb-6">
                            Your analyzed conversations will appear here
                        </p>
                        <Link href="/dashboard" className="btn btn-primary">
                            Go to Dashboard
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
