"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Conversation, AIResponse } from "@/types";
import {
  X,
  Copy,
  Check,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  Zap,
  Smile,
  Heart,
} from "lucide-react";

interface ConversationModalProps {
  conversationId: string | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

export function ConversationModal({
  conversationId,
  onClose,
  onDeleted,
}: ConversationModalProps) {
  const { showToast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await api.conversations.get(conversationId);
        setConversation(data);
      } catch (err: any) {
        showToast(err.message || "Failed to load conversation details", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [conversationId, onClose, showToast]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!conversationId) return null;

  const handleCopy = async (resp: AIResponse) => {
    try {
      await navigator.clipboard.writeText(resp.content);
      setCopiedId(resp.id);
      showToast("Copied to clipboard!", "success");

      if (conversation?.id) {
        api.conversations.markCopied(conversation.id, resp.id).catch(() => {});
      }

      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const handleDelete = async () => {
    if (!conversation?.id) return;
    if (!confirm("Are you sure you want to delete this conversation record?")) return;

    setDeleting(true);
    try {
      await api.conversations.delete(conversation.id);
      showToast("Conversation deleted", "success");
      if (onDeleted) onDeleted(conversation.id);
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to delete conversation", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getToneBadge = (tone: string) => {
    const t = tone.toLowerCase();
    if (t === "warm") {
      return (
        <span className="clay-badge clay-badge-terracotta">
          <Heart className="w-3 h-3 text-[#D97757]" /> Warm
        </span>
      );
    }
    if (t === "playful") {
      return (
        <span className="clay-badge clay-badge-honey">
          <Smile className="w-3 h-3 text-[#C89628]" /> Playful
        </span>
      );
    }
    return (
      <span className="clay-badge clay-badge-denim">
        <Zap className="w-3 h-3 text-[#5387A6]" /> Direct
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#27221E]/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FFFDF9] dark:bg-[#1C1916] rounded-3xl p-6 sm:p-8 shadow-[0_20px_40px_-8px_rgba(180,160,140,0.45),inset_0_2px_4px_#FFF] dark:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.08)] border border-white dark:border-[#332A22] space-y-6 text-[#14100D] dark:text-[#FAF6F0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#EAE0D4] dark:border-[#352E26] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#EAE0D4] dark:bg-[#2A231C] text-[#211A14] dark:text-[#E8DFD1] capitalize">
                {conversation?.platform || "Chat"}
              </span>
              {conversation?.detected_tone && getToneBadge(conversation.detected_tone)}
            </div>
            <h2 className="text-xl font-black text-[#14100D] dark:text-[#FAF6F0] tracking-tight">Conversation Analysis</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting || loading}
              className="w-9 h-9 rounded-xl bg-[#FCEAE6] dark:bg-[#321B16] text-[#D36A48] hover:bg-[#F9D7CF] dark:hover:bg-[#43231C] flex items-center justify-center transition shadow-sm border border-[#F5C0B1] dark:border-[#52291E]"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#EFE8DC] dark:bg-[#28211A] text-[#211A14] dark:text-[#FAF6F0] hover:bg-[#E5DCCE] dark:hover:bg-[#332B22] flex items-center justify-center transition shadow-sm border border-[#DCD0C1] dark:border-[#3A3026]"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-[#574B3F] dark:text-[#A09282] space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#D36A48] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold">Loading details...</p>
          </div>
        ) : conversation ? (
          <div className="space-y-6">
            {/* Context Summary */}
            <div className="clay-card-sage p-5 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#082417] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#082417]" />
                Context Summary
              </h3>
              <p className="text-sm text-[#0C291B] leading-relaxed font-bold">
                {conversation.context_summary || "No context summary available."}
              </p>
            </div>

            {/* AI Responses */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#29211A] dark:text-[#E8DFD1] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D36A48]" />
                Suggested Responses ({conversation.responses?.length || 0})
              </h3>

              <div className="space-y-3">
                {conversation.responses && conversation.responses.length > 0 ? (
                  conversation.responses.map((resp) => {
                    const isCopied = copiedId === resp.id;
                    const isWarm = resp.tone.toLowerCase() === "warm";
                    const isPlayful = resp.tone.toLowerCase() === "playful";
                    const cardClass = isWarm
                      ? "clay-card-terracotta"
                      : isPlayful
                      ? "clay-card-honey"
                      : "clay-card-denim";

                    return (
                      <div key={resp.id} className={`${cardClass} p-5 space-y-3`}>
                        <div className="flex items-center justify-between">
                          {getToneBadge(resp.tone)}
                          <span className="text-xs font-bold text-[#40352B] dark:text-[#C5B8A8]">
                            {resp.character_count || resp.content.length} chars
                          </span>
                        </div>

                        <p className="text-sm sm:text-base text-[#14100D] dark:text-[#FAF6F0] leading-relaxed font-black">
                          {resp.content}
                        </p>

                        <button
                          onClick={() => handleCopy(resp)}
                          className={`clay-btn w-full text-xs py-2 transition font-black ${
                            isCopied
                              ? "bg-[#CEE7DC] dark:bg-[#1A382B] text-[#07261A] dark:text-[#D1F2E2] shadow-sm border border-[#ACD6C2] dark:border-[#2D5A47]"
                              : "clay-btn-secondary"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
                              <span>Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#574B3F] dark:text-[#A09282] italic font-bold">No responses stored for this conversation.</p>
                )}
              </div>
            </div>

            {/* Date Footer */}
            <div className="flex items-center gap-1.5 text-xs text-[#574B3F] dark:text-[#A09282] font-bold pt-2 border-t border-[#EAE0D4] dark:border-[#352E26]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created on {new Date(conversation.created_at).toLocaleString()}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
