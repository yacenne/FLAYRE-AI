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
  History,
  Clock,
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
  Inbox,
  Play,
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
      <div className="min-h-screen bg-[var(--clay-bg)] flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-3 border-[#D97757] border-t-transparent animate-spin" />
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
    <div className="min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text-primary)] flex flex-col lg:flex-row max-w-[1600px] mx-auto">
      {/* Left Sage Sidebar */}
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

        <main className="px-4 sm:px-6 space-y-6 flex-1">
          {error ? (
            <div className="clay-card p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-[#D97757]">{error}</p>
              <button
                onClick={() => fetchConversations(currentPage)}
                className="clay-btn clay-btn-primary text-xs py-2 px-4 rounded-xl font-bold inline-flex"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="py-20 text-center text-[#7A6F65] space-y-2">
              <div className="w-7 h-7 rounded-full border-3 border-[#D97757] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading past analyses...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-3">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className="clay-card-interactive p-5 flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="clay-tile clay-tile-sage w-11 h-11 shrink-0 font-black text-xs uppercase mt-0.5">
                      {conv.platform?.slice(0, 2) || "CH"}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[#14100D] dark:text-[#FAF6F0] capitalize">
                          {conv.platform}
                        </span>
                        {conv.detected_tone && (
                          <span className="clay-badge clay-badge-terracotta text-[10px] py-0.5 px-2 capitalize">
                            {conv.detected_tone}
                          </span>
                        )}
                        {conv.relationship_type && (
                          <span className="clay-badge clay-badge-denim text-[10px] py-0.5 px-2 capitalize">
                            {conv.relationship_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#2A221B] dark:text-[#FAF6F0] line-clamp-2 leading-relaxed">
                        {conv.context_summary || "Conversation screenshot analysis"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#574B3F] dark:text-[#B5A593] pt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(conv.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black text-[#D36A48] opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                      Inspect
                    </span>
                    <div className="w-9 h-9 rounded-full bg-[#EFF5FA] dark:bg-[#1E2E3B] shadow-[0_2px_5px_rgba(125,95,75,0.22),inset_0_1px_1px_#FFF] dark:shadow-[0_2px_5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.06)] border border-[#CDE0EE] dark:border-[#2C485E] flex items-center justify-center text-[#1C4E72] dark:text-[#88C6F2] group-hover:bg-[#D36A48] group-hover:text-white transition">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-[#EAE0D4] dark:border-[#352E26]">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="clay-btn clay-btn-secondary text-xs flex items-center gap-1 disabled:opacity-40 font-black"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-black text-[#2A221B] dark:text-[#FAF6F0]">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="clay-btn clay-btn-secondary text-xs flex items-center gap-1 disabled:opacity-40 font-black"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="clay-card p-16 text-center space-y-4">
              <div className="clay-tile clay-tile-sage w-14 h-14 mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-[#14100D] dark:text-[#FAF6F0]">No conversation records found</h2>
                <p className="text-xs font-bold text-[#4A3E33] dark:text-[#B5A593] max-w-sm mx-auto">
                  {searchQuery
                    ? "No conversations match your search filter."
                    : "Analyses you perform will appear here."}
                </p>
              </div>
              <Link href="/analyze" className="clay-btn clay-btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 rounded-xl font-bold">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Analyze a Screenshot</span>
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
