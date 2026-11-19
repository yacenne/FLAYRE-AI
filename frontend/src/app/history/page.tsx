"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { ConversationModal } from "@/components/ConversationModal";
import type { Conversation, SubscriptionInfo } from "@/types";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Inbox,
  ArrowRight,
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const fetchConversations = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const [convData, subData] = await Promise.allSettled([
        api.conversations.list(page, 10),
        api.billing.getSubscription(),
      ]);

      if (convData.status === "fulfilled") {
        setConversations(convData.value.items || []);
        setTotalPages(convData.value.total_pages || Math.ceil((convData.value.total || 0) / 10) || 1);
      }
      if (subData.status === "fulfilled") {
        setSubscription(subData.value);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load conversation history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/history");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations(currentPage);
    }
  }, [isAuthenticated, currentPage, fetchConversations]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5238] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPro = subscription?.is_pro || false;
  const remaining = subscription?.usage.analyses_remaining ?? 10;

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.context_summary && c.context_summary.toLowerCase().includes(q)) ||
      (c.platform && c.platform.toLowerCase().includes(q)) ||
      (c.detected_tone && c.detected_tone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col lg:flex-row max-w-[1600px] mx-auto">
      {/* Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar remainingCredits={remaining} isPro={isPro} />
      </div>

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Navbar
          title="Conversation History"
          onSearch={(q) => setSearchQuery(q)}
          searchPlaceholder="Filter past conversations..."
          remainingCredits={remaining}
          isPro={isPro}
        />

        <main className="px-4 sm:px-6 space-y-4 flex-1">
          {error ? (
            <div className="clay-card p-8 text-center space-y-3 bg-white border border-slate-200">
              <p className="text-sm font-semibold text-rose-600">{error}</p>
              <button
                onClick={() => fetchConversations(currentPage)}
                className="clay-btn-primary text-xs py-2 px-4 rounded-xl font-bold inline-flex shadow-sm"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <div className="w-7 h-7 rounded-full border-2 border-[#FF5238] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs">Loading past analyses...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-3">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className="clay-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-300 bg-white transition-all group shadow-sm border border-slate-200"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs uppercase text-slate-700 shrink-0 mt-0.5">
                      {conv.platform?.slice(0, 2) || "CH"}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 capitalize">
                          {conv.platform}
                        </span>
                        {conv.detected_tone && (
                          <span className="clay-badge-terracotta text-[10px] py-0.5 px-2 capitalize">
                            {conv.detected_tone}
                          </span>
                        )}
                        {conv.relationship_type && (
                          <span className="clay-badge-denim text-[10px] py-0.5 px-2 capitalize">
                            {conv.relationship_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed font-normal">
                        {conv.context_summary || "Conversation screenshot analysis"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(conv.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-[#FF5238] opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                      Inspect
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#FF5238] group-hover:border-[#FF5238] transition">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="clay-btn-secondary text-xs flex items-center gap-1 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-mono text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="clay-btn-secondary text-xs flex items-center gap-1 disabled:opacity-30"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="clay-card p-16 text-center space-y-4 bg-white shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">No records found</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? "No past conversations match your filter query."
                    : "Analyses you run will automatically be archived here."}
                </p>
              </div>
              <Link
                href="/analyze"
                className="clay-btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 rounded-xl font-bold shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Start New Analysis</span>
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <ConversationModal
        conversationId={selectedConversationId}
        onClose={() => setSelectedConversationId(null)}
        onDeleted={(deletedId) => {
          setConversations((prev) => prev.filter((c) => c.id !== deletedId));
        }}
      />
    </div>
  );
}
