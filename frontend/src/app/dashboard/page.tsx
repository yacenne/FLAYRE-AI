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
  Play,
  ArrowRight,
  TrendingUp,
  Headphones,
  CheckCircle2,
  Calendar,
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
      <div className="min-h-screen bg-[var(--clay-bg)] flex items-center justify-center transition-colors duration-200">
        <div className="w-9 h-9 rounded-full border-3 border-[#D36A48] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPro = subscription?.is_pro || false;
  const used = subscription?.usage.analyses_used || 0;
  const remaining = subscription?.usage.analyses_remaining ?? 10;
  const displayName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Friend";

  return (
    <div className="min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text-primary)] flex flex-col lg:flex-row max-w-[1600px] mx-auto transition-colors duration-200">
      {/* Left Sage Sidebar (from Reference Image) */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar remainingCredits={remaining} isPro={isPro} />
      </div>

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        {/* Top Bar with Search & Profile */}
        <Navbar
          title="Dashboard"
          remainingCredits={remaining}
          isPro={isPro}
        />

        <main className="px-4 sm:px-6 space-y-6 flex-1">
          {/* ============================================================================ */}
          {/* 1. Hero Greeting Banner (faithfully matching reference image) */}
          {/* ============================================================================ */}
          <div className="clay-card-terracotta p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            {/* Mascot Character with Headphones */}
            <div className="flex items-center gap-5 sm:gap-6 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1A16] shadow-[0_8px_20px_rgba(211,106,72,0.35),inset_0_2px_4px_#FFF] dark:shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-white dark:border-[#352E26] flex items-center justify-center p-2 shrink-0">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-[#D36A48] via-[#E28E6E] to-[#F8D57E] flex items-center justify-center relative shadow-inner">
                  <Flame className="w-10 h-10 text-white drop-shadow-md" />
                  <Headphones className="w-12 h-12 text-[#102B20] dark:text-[#0A1A14] absolute -top-1 opacity-95" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#82331C] dark:text-[#FAC0B0]">
                    Daily Assistant
                  </span>
                  <span className="text-sm">✨</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#210D07] dark:text-[#FAF6F0] tracking-normal">
                  Good Day, {displayName}!
                </h2>
                <p className="text-xs sm:text-sm text-[#4F2014] dark:text-[#E8C0B5] max-w-md font-bold">
                  Have an unread text or an awkward message? Let&apos;s craft the perfect response today!
                </p>
              </div>
            </div>

            {/* Tactile Coral Action Button */}
            <Link
              href="/analyze"
              className="clay-btn clay-btn-primary py-3 px-6 text-sm font-bold inline-flex items-center gap-2.5 z-10 shrink-0 self-start md:self-center rounded-2xl shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Analysis</span>
            </Link>
          </div>

          {/* ============================================================================ */}
          {/* 2. Four 3D Clay Stat Cards (faithfully matching reference image) */}
          {/* ============================================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Stat 1: Analyses Used */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="clay-tile clay-tile-sage w-11 h-11">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#40352B] dark:text-[#C8BEB2]">Analyses Done</p>
                <p className="text-2xl sm:text-3xl font-black text-[#14100D] dark:text-[#FAF6F0] tracking-tight">{used}</p>
                <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>+1 today</span>
                </p>
              </div>
            </div>

            {/* Stat 2: Saved Responses */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="clay-tile clay-tile-terracotta w-11 h-11">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#40352B] dark:text-[#C8BEB2]">Responses Copied</p>
                <p className="text-2xl sm:text-3xl font-black text-[#14100D] dark:text-[#FAF6F0] tracking-tight">
                  {Math.max(used * 2, 4)}
                </p>
                <p className="text-[11px] font-bold text-[#8C341C] dark:text-[#F8C3B4] flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Favorite suggestions</span>
                </p>
              </div>
            </div>

            {/* Stat 3: Analyses Remaining */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="clay-tile clay-tile-honey w-11 h-11">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#40352B] dark:text-[#C8BEB2]">Remaining Quota</p>
                <p className="text-2xl sm:text-3xl font-black text-[#14100D] dark:text-[#FAF6F0] tracking-tight">
                  {isPro ? "∞" : remaining}
                </p>
                <p className="text-[11px] font-bold text-[#6E5004] dark:text-[#F8E2A1] flex items-center gap-1 mt-0.5">
                  <span>Renews monthly</span>
                </p>
              </div>
            </div>

            {/* Stat 4: Membership / Plan */}
            <div className="clay-card p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="clay-tile clay-tile-denim w-11 h-11">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#40352B] dark:text-[#C8BEB2]">Active Tier</p>
                <p className="text-xl sm:text-2xl font-black text-[#14100D] dark:text-[#FAF6F0] tracking-tight">
                  {isPro ? "flayre Pro" : "Free Starter"}
                </p>
                <p className="text-[11px] font-bold text-[#143B57] dark:text-[#C0DFF8] flex items-center gap-1 mt-0.5">
                  <span>{isPro ? "Unlimited Access" : "10 per month"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* 3. Middle Section: Activity Pill Visualizer & Tone Donut (From Reference) */}
          {/* ============================================================================ */}
          <div className="grid md:grid-cols-12 gap-5 items-stretch">
            {/* Weekly Activity Pill Bars */}
            <div className="clay-card p-5 sm:p-6 md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#14100D] dark:text-[#FAF6F0]">Activity Overview</h3>
                  <p className="text-xs font-bold text-[#4A3E33] dark:text-[#C8BEB2]">Screenshots analyzed this week</p>
                </div>
                <span className="clay-badge clay-badge-sage text-xs">This Week</span>
              </div>

              {/* 3D Clay Pill Bars */}
              <div className="flex items-end justify-between gap-2 sm:gap-3 h-40 pt-4 px-2">
                {[
                  { day: "Mon", height: "45%", color: "bg-[#F3B4A2] border-[#E89E8A] dark:bg-[#6E3524] dark:border-[#8C4530]" },
                  { day: "Tue", height: "70%", color: "bg-[#FCE19D] border-[#EECD7B] dark:bg-[#785C19] dark:border-[#967523]" },
                  { day: "Wed", height: "55%", color: "bg-[#B6D4C7] border-[#97C2B0] dark:bg-[#285743] dark:border-[#38755B]" },
                  { day: "Thu", height: "85%", color: "bg-[#E28E6E] border-[#D17652] dark:bg-[#853D25] dark:border-[#A85135]" },
                  { day: "Fri", height: "60%", color: "bg-[#BEDAEB] border-[#A2C7DF] dark:bg-[#284E6E] dark:border-[#376994]" },
                  { day: "Sat", height: "90%", color: "bg-[#9AC0AF] border-[#7FAD97] dark:bg-[#326950] dark:border-[#428768]" },
                  { day: "Sun", height: "40%", color: "bg-[#D9A3B5] border-[#C7879C] dark:bg-[#6E3747] dark:border-[#8E495D]" },
                ].map((col) => (
                  <div key={col.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className={`w-full max-w-[28px] ${col.color} border rounded-full shadow-[0_4px_10px_rgba(140,110,90,0.30),inset_0_2px_3px_rgba(255,255,255,0.9),inset_0_-2px_3px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.5)] transition-all duration-500`}
                      style={{ height: col.height }}
                    />
                    <span className="text-xs font-black text-[#2D241C] dark:text-[#D5CBC0]">{col.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tone Distribution Visualizer */}
            <div className="clay-card p-5 sm:p-6 md:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-black text-[#14100D] dark:text-[#FAF6F0]">Suggested Tones</h3>
                <p className="text-xs font-bold text-[#4A3E33] dark:text-[#C8BEB2]">Style preferences breakdown</p>
              </div>

              <div className="flex items-center justify-center py-2">
                {/* 3D Clay Donut Illustration */}
                <div className="relative w-32 h-32 rounded-full shadow-[0_8px_20px_rgba(140,110,90,0.32),inset_0_2px_4px_#FFF] dark:shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center justify-center p-2 border border-[#E2D7C8] dark:border-[#352E26]">
                  <div className="w-full h-full rounded-full border-8 border-[#F3B4A2] dark:border-[#7A3624] border-t-[#BEDAEB] dark:border-t-[#2E577A] border-r-[#FCE19D] dark:border-r-[#7D601E] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#FFFFFF] dark:bg-[#1E1A16] shadow-inner flex flex-col items-center justify-center border border-[#EAE0D4] dark:border-[#352E26]">
                      <span className="text-xs font-black text-[#14100D] dark:text-[#FAF6F0]">3 Tones</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend Chips */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAE0D4] dark:border-[#352E26] text-center">
                <div className="clay-card-terracotta p-1.5 rounded-xl">
                  <p className="text-[10px] font-black text-[#702511] dark:text-[#FAC0B0]">Warm</p>
                  <p className="text-xs font-black text-[#2B0A03] dark:text-[#FAF6F0]">45%</p>
                </div>
                <div className="clay-card-denim p-1.5 rounded-xl">
                  <p className="text-[10px] font-black text-[#11324B] dark:text-[#C0DFF8]">Direct</p>
                  <p className="text-xs font-black text-[#081824] dark:text-[#FAF6F0]">35%</p>
                </div>
                <div className="clay-card-honey p-1.5 rounded-xl">
                  <p className="text-[10px] font-black text-[#573E02] dark:text-[#F8E2A1]">Playful</p>
                  <p className="text-xs font-black text-[#2E2001] dark:text-[#FAF6F0]">20%</p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* 4. Recent Analyses Cards (faithfully matching reference image) */}
          {/* ============================================================================ */}
          <div className="clay-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#14100D] dark:text-[#FAF6F0]">Recently Analyzed</h3>
                <p className="text-xs font-bold text-[#4A3E33] dark:text-[#C8BEB2]">Click any card to inspect and copy suggestions</p>
              </div>
              <Link
                href="/history"
                className="clay-badge clay-badge-terracotta hover:scale-105 transition-transform"
              >
                <span>See All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[#4A3E33] dark:text-[#C8BEB2] space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#D36A48] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-bold">Loading recent conversations...</p>
              </div>
            ) : conversations.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className="clay-card-interactive p-4 flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="clay-tile clay-tile-sage w-10 h-10 shrink-0 font-black text-xs uppercase">
                        {conv.platform?.slice(0, 2) || "CH"}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-black text-[#14100D] dark:text-[#FAF6F0] capitalize truncate">
                          {conv.platform}
                        </p>
                        <p className="text-[11px] font-bold text-[#4A3E33] dark:text-[#C8BEB2] truncate max-w-[140px]">
                          {conv.context_summary || "Conversation screenshot"}
                        </p>
                      </div>
                    </div>

                    {/* Circular Play / Inspect button (From Reference) */}
                    <div className="w-8 h-8 rounded-full bg-[#EFF5FA] dark:bg-[#1E2E3D] shadow-[0_2px_5px_rgba(140,110,90,0.22),inset_0_1px_1px_#FFF] dark:shadow-[0_2px_5px_rgba(0,0,0,0.4)] border border-[#CDE0EE] dark:border-[#2D4760] flex items-center justify-center text-[#1C4E72] dark:text-[#C0DFF8] group-hover:scale-110 group-hover:bg-[#D36A48] group-hover:text-white transition-all shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="clay-tile clay-tile-sage w-12 h-12 mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-[#14100D] dark:text-[#FAF6F0]">No conversations yet</p>
                  <p className="text-xs font-bold text-[#4A3E33] dark:text-[#C8BEB2]">Upload your first screenshot to see suggestions here!</p>
                </div>
                <Link href="/analyze" className="clay-btn clay-btn-primary text-xs py-2 px-4 rounded-xl inline-flex font-bold">
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
