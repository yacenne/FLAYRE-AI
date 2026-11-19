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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <Heart className="w-3 h-3 text-[#FF5238]" /> Warm
        </span>
      );
    }
    if (t === "playful") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Smile className="w-3 h-3 text-purple-600" /> Playful
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Zap className="w-3 h-3 text-blue-600" /> Direct
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                {conversation?.platform || "Chat"}
              </span>
              {conversation?.detected_tone && getToneBadge(conversation.detected_tone)}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Conversation Analysis</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting || loading}
              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition border border-rose-200"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition border border-slate-200 dark:border-slate-700"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#FF5238] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-medium">Loading details...</p>
          </div>
        ) : conversation ? (
          <div className="space-y-6">
            {/* Context Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Context Summary
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                {conversation.context_summary || "No context summary available."}
              </p>
            </div>

            {/* AI Responses */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5238]" />
                Generated Suggestions ({conversation.responses?.length || 0})
              </h3>

              <div className="space-y-3">
                {conversation.responses && conversation.responses.length > 0 ? (
                  conversation.responses.map((resp) => {
                    const isCopied = copiedId === resp.id;
                    return (
                      <div
                        key={resp.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 hover:border-slate-300 transition shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          {getToneBadge(resp.tone)}
                          <span className="text-xs text-slate-400 font-mono">
                            {resp.character_count || resp.content.length} chars
                          </span>
                        </div>

                        <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                          &ldquo;{resp.content}&rdquo;
                        </p>

                        <button
                          onClick={() => handleCopy(resp)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 ${
                            isCopied
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : "clay-btn-secondary"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                  <p className="text-xs text-slate-400 italic">No responses stored for this conversation.</p>
                )}
              </div>
            </div>

            {/* Date Footer */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created on {new Date(conversation.created_at).toLocaleString()}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
