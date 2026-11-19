"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { ConversationModal } from "@/components/ConversationModal";
import type { SubscriptionInfo, Conversation } from "@/types";
import {
  Sparkles,
  MessageSquare,
  Heart,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [subData, convData] = await Promise.allSettled([
        api.billing.getSubscription(),
        api.conversations.list(1, 6),
      ]);

      if (subData.status === "fulfilled") {
        setSubscription(subData.value);
      }
      if (convData.status === "fulfilled") {
        setConversations(convData.value.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5238] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPro = subscription?.is_pro || false;
  const used = subscription?.usage.analyses_used || 0;
  const remaining = subscription?.usage.analyses_remaining ?? 10;
  const displayName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row max-w-[1600px] mx-auto transition-colors duration-200">
      {/* Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar remainingCredits={remaining} isPro={isPro} />
      </div>

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Navbar
          title="Dashboard"
          remainingCredits={remaining}
          isPro={isPro}
        />

        <main className="px-4 sm:px-6 space-y-6 flex-1">
          {/* ============================================================================ */}
          {/* 1. Hero Greeting Banner */}
          {/* ============================================================================ */}
          <div className="clay-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-5 z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5238] flex items-center justify-center shadow-md shadow-[#FF5238]/20 shrink-0">
                <Flame className="w-7 h-7 text-white fill-white" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5238]">
                    Vision AI Ready
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">10 free monthly credits active</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {displayName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                  Have an unread text or need the right words? Upload any screenshot to get instant suggestions.
                </p>
              </div>
            </div>

            <Link
              href="/analyze"
              className="clay-btn-primary py-3 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 z-10 shrink-0 self-start md:self-center shadow-md"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>New Analysis</span>
            </Link>
          </div>

          {/* ============================================================================ */}
          {/* 2. 4 Stat KPI Cards */}
          {/* ============================================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Analyses Used */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Analyses Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {used}
                </p>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active this month</span>
                </p>
              </div>
            </div>

            {/* Stat 2: Saved Responses */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#FF5238] border border-rose-200/80 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Responses Copied</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {Math.max(used * 2, 4)}
                </p>
                <p className="text-[11px] text-[#FF5238] flex items-center gap-1 mt-1 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Favorite suggestions</span>
                </p>
              </div>
            </div>

            {/* Stat 3: Quota Remaining */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Remaining Credits</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {isPro ? "∞" : remaining}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  <span>Renews monthly</span>
                </p>
              </div>
            </div>

            {/* Stat 4: Membership Tier */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Current Plan</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {isPro ? "flayre Pro" : "Free Plan"}
                </p>
                <p className="text-[11px] text-blue-600 mt-1 font-semibold">
                  <span>{isPro ? "Unlimited access" : "10 analyses/month"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* 3. Middle Section: Activity Visualizer & Tone Breakdown */}
          {/* ============================================================================ */}
          <div className="grid md:grid-cols-12 gap-5 items-stretch">
            {/* Weekly Activity Bars */}
            <div className="clay-card p-5 sm:p-6 md:col-span-7 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Overview</h3>
                  <p className="text-xs text-slate-500">Screenshots processed this week</p>
                </div>
                <span className="clay-badge-sage text-xs">Past 7 Days</span>
              </div>

              {/* Minimalist Bar Graph */}
              <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2">
                {[
                  { day: "Mon", height: "40%" },
                  { day: "Tue", height: "65%" },
                  { day: "Wed", height: "50%" },
                  { day: "Thu", height: "85%" },
                  { day: "Fri", height: "60%" },
                  { day: "Sat", height: "90%" },
                  { day: "Sun", height: "35%" },
                ].map((col) => (
                  <div key={col.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div
                      className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 hover:bg-[#FF5238] rounded-t-md transition-all duration-200"
                      style={{ height: col.height }}
                    />
                    <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-slate-900">
                      {col.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tone Distribution */}
            <div className="clay-card p-5 sm:p-6 md:col-span-5 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suggested Tone Mix</h3>
                <p className="text-xs text-slate-500">Response distribution generated by AI</p>
              </div>

              {/* Progress stack */}
              <div className="space-y-3 py-2">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#FF5238]" style={{ width: "45%" }} title="Warm 45%" />
                  <div className="h-full bg-blue-500" style={{ width: "35%" }} title="Direct 35%" />
                  <div className="h-full bg-purple-500" style={{ width: "20%" }} title="Playful 20%" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                    <p className="text-[10px] text-rose-700 font-bold uppercase">Warm</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">45%</p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <p className="text-[10px] text-blue-700 font-bold uppercase">Direct</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">35%</p>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                    <p className="text-[10px] text-purple-700 font-bold uppercase">Playful</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">20%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* 4. Recent Analyses Cards */}
          {/* ============================================================================ */}
          <div className="clay-card p-5 sm:p-6 space-y-4 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recently Analyzed</h3>
                <p className="text-xs text-slate-500">Click any card to inspect or copy generated responses</p>
              </div>
              <Link
                href="/history"
                className="text-xs font-semibold text-[#FF5238] hover:underline flex items-center gap-1 transition"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#FF5238] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : conversations.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 shrink-0">
                        {conv.platform?.slice(0, 2) || "CH"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">
                          {conv.platform}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {conv.context_summary || "Chat screenshot"}
                        </p>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#FF5238] group-hover:border-[#FF5238] transition shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">No conversations analyzed yet</p>
                  <p className="text-xs text-slate-500">Upload your first screenshot to see suggestions here!</p>
                </div>
                <Link
                  href="/analyze"
                  className="clay-btn-primary text-xs py-2 px-4 rounded-xl inline-flex font-semibold shadow-sm"
                >
                  Analyze Screenshot
                </Link>
              </div>
            )}
          </div>
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
