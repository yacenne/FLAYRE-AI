"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClayToneSlider, type ToneOption } from "./ClayToneSlider";
import {
  Flame,
  Bell,
  User,
  Plus,
  Copy,
  Check,
  Smile,
  Send,
  Sparkles,
  Layers,
  Inbox,
  Briefcase,
  MessageSquare,
  Grid,
  Star,
  Users,
  Camera,
  CircleDot,
} from "lucide-react";

interface Scenario {
  id: string;
  tileTitle: string;
  tileCategory: string;
  tileColorClass: string;
  topIcon: "flame" | "star" | null;
  bottomIcons: string[];
  senderName: string;
  clientContext: string;
  userMessage: string;
  tones: Record<string, string>;
}

const SCENARIOS: Scenario[] = [
  {
    id: "aperture",
    tileTitle: "Aperture Co.",
    tileCategory: "Ghosted / Reconnection",
    tileColorClass: "clay-tile-peach",
    topIcon: "flame",
    bottomIcons: ["layers", "inbox", "dot"],
    senderName: "User (Alex)",
    clientContext: "Texting / Follow-up",
    userMessage: "Hey stranger, sorry for disappearing! Things got crazy busy this week. How are you doing?",
    tones: {
      casual: "No worries at all! Life gets hectic. I've been great—let's grab coffee when you catch your breath.",
      professional: "Thanks for checking in, Alex. All is progressing well on my end. Let me know when your calendar opens up to sync.",
      creative: "Look who surfaced! I'll let you off the hook this time 😉 How was the creative storm?",
      friendly: "Hey Alex! Great to hear from you! No need to apologize at all. Would love to catch up soon!",
    },
  },
  {
    id: "articulate",
    tileTitle: "Project: Articulate",
    tileCategory: "Client: Studio K",
    tileColorClass: "clay-tile-sage-green",
    topIcon: null,
    bottomIcons: ["briefcase", "chat", "grid"],
    senderName: "User (Sarah)",
    clientContext: "Branding & Strategy",
    userMessage: "Could you draft a proposal for the rebranding campaign?",
    tones: {
      casual: "Sure thing! Let's lock in the goals and budget first and I'll whip up a draft.",
      professional: "Certainly! Let's start with the key objectives. What's the budget?",
      creative: "Love this venture! Let's define the visual pillars and story angles first. What timeline are you thinking?",
      friendly: "Hey Sarah! Absolutely, so thrilled to work on this. Let's outline the core vision and budget together!",
    },
  },
  {
    id: "velvet",
    tileTitle: "Velvet & Co.",
    tileCategory: "Social / Invitation",
    tileColorClass: "clay-tile-ochre",
    topIcon: "star",
    bottomIcons: ["camera", "users", "grid"],
    senderName: "User (Jordan)",
    clientContext: "Weekend Plans",
    userMessage: "Are you coming out with everyone tonight? We're heading to the new lounge downtown.",
    tones: {
      casual: "Tempting! I need a low-key night to recharge tonight, but definitely count me in for next weekend.",
      professional: "Thank you for the invitation! Unfortunately I have prior commitments this evening, but enjoy the night!",
      creative: "My couch and a good book already claimed first dibs tonight! 🛋️ Have a drink for me though!",
      friendly: "Aww thank you so much for the invite Jordan! I won't make it tonight, but have the absolute best time with the crew!",
    },
  },
];

const TONE_OPTIONS: ToneOption[] = [
  { id: "casual", label: "Casual", emoji: "😊" },
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "creative", label: "Creative", emoji: "✨" },
  { id: "friendly", label: "Friendly", emoji: "💛" },
];

export function CeramicStudioConsole() {
  // Default to 'articulate' to match the uploaded photo
  const [activeScenarioId, setActiveScenarioId] = useState<string>("articulate");
  const [activeTone, setActiveTone] = useState<string>("professional");
  const [copied, setCopied] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");
  const [activeMessages, setActiveMessages] = useState<Array<{ sender: string; text: string; isAi: boolean }>>([]);

  const currentScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[1];

  const handleCopy = () => {
    const textToCopy = currentScenario.tones[activeTone];
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const userText = customInput.trim();
    setCustomInput("");

    setActiveMessages((prev) => [
      ...prev,
      { sender: "User (Sarah)", text: userText, isAi: false },
      {
        sender: "flayre.ai",
        text: `Certainly! Here is a tailored ${activeTone} suggestion based on your prompt: "Let's align on the scope and finalize the next steps."`,
        isAi: true,
      },
    ]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Studio Workbench Desk Backdrop */}
      <div className="ceramic-studio-desk">
        {/* 3D Sculpted Ceramic Console Frame (Terracotta Outer Bezel) */}
        <div className="ceramic-console-frame">
          {/* Inset Porcelain Ceramic Tablet Face */}
          <div className="ceramic-console-face relative">
            {/* Top Console Brand Bar */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E6DDD0] dark:border-[#2C241D]">
              {/* Logo & Brand */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#E2896D] to-[#C9694E] shadow-[0_3px_8px_rgba(140,55,30,0.35),inset_0_2px_2px_rgba(255,255,255,0.7)] flex items-center justify-center text-white font-black text-sm">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <span className="font-extrabold text-2xl tracking-normal text-[#2D221A] dark:text-[#FAF6F0] ceramic-debossed-text [word-spacing:0.04em]">
                  flayre<span className="text-[#D36A48]">.ai</span>
                </span>
              </div>

              {/* Top Right Controls: Bell and Avatar Stamps */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full ceramic-stamp-recess flex items-center justify-center text-[#5C4D3E] dark:text-[#C5B8A8] hover:text-[#D36A48] transition cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>

                <div 
                  className="w-9 h-9 rounded-full bg-[#E5957F] dark:bg-[#4E271C] shadow-[0_2px_6px_rgba(125,55,35,0.35),inset_0_1px_2px_#FFF] border border-[#D57B65] dark:border-[#5F3024] flex items-center justify-center text-[#581F12] dark:text-[#F3987A] font-bold text-xs"
                  title="User Profile"
                >
                  <User className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Console 3-Column Studio Grid */}
            <div className="grid lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* ============================================================================ */}
              {/* Left Column: 3 Sculpted Square Clay Project Tiles */}
              {/* ============================================================================ */}
              <div className="lg:col-span-3 flex flex-col justify-between gap-3">
                {SCENARIOS.map((sc) => {
                  const isSelected = sc.id === activeScenarioId;

                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setActiveScenarioId(sc.id)}
                      className={`clay-studio-tile ${sc.tileColorClass} text-left w-full h-full min-h-[105px] flex flex-col justify-between p-3.5 transition-all ${
                        isSelected
                          ? "ring-3 ring-[#D36A48] dark:ring-[#E2724E] scale-[1.02] shadow-lg"
                          : "opacity-90 hover:opacity-100"
                      }`}
                    >
                      {/* Top Stamp (if present) */}
                      <div className="flex items-center justify-between w-full">
                        {sc.topIcon === "flame" && (
                          <div className="w-5 h-5 rounded-md bg-white/70 dark:bg-black/30 border border-black/10 flex items-center justify-center shadow-xs">
                            <Flame className="w-3 h-3 text-[#B8573A]" />
                          </div>
                        )}
                        {sc.topIcon === "star" && (
                          <div className="w-5 h-5 rounded-md bg-white/70 dark:bg-black/30 border border-black/10 flex items-center justify-center shadow-xs">
                            <Star className="w-3 h-3 text-[#9A7228] fill-current" />
                          </div>
                        )}
                        {sc.topIcon === null && <div className="h-5" />}
                      </div>

                      {/* Tile Title */}
                      <div className="my-1">
                        <span className="text-xs sm:text-sm font-black text-[#1F1611] dark:text-[#FAF6F0] block leading-tight">
                          {sc.tileTitle}
                        </span>
                      </div>

                      {/* Bottom Micro-Stamps Row */}
                      <div className="flex items-center gap-2 pt-1 border-t border-black/10 dark:border-white/10 text-black/55 dark:text-white/55">
                        {sc.bottomIcons.includes("layers") && <Layers className="w-3 h-3" />}
                        {sc.bottomIcons.includes("inbox") && <Inbox className="w-3 h-3" />}
                        {sc.bottomIcons.includes("briefcase") && <Briefcase className="w-3 h-3" />}
                        {sc.bottomIcons.includes("chat") && <MessageSquare className="w-3 h-3" />}
                        {sc.bottomIcons.includes("grid") && <Grid className="w-3 h-3" />}
                        {sc.bottomIcons.includes("camera") && <Camera className="w-3 h-3" />}
                        {sc.bottomIcons.includes("users") && <Users className="w-3 h-3" />}
                        {sc.bottomIcons.includes("dot") && <CircleDot className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ============================================================================ */}
              {/* Center Column: Active Conversations Banner & 3D Speech Bubbles */}
              {/* ============================================================================ */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-3.5 rounded-3xl p-3.5 sm:p-4 bg-white/60 dark:bg-[#15110E]/70 border border-[#E4DAD0] dark:border-[#332A22] shadow-[inset_0_2px_4px_rgba(100,75,55,0.08)]">
                {/* Top Sage Active Conversation Bar */}
                <div className="rounded-2xl p-2.5 px-3.5 bg-[#9EBFA8] text-[#0A261A] dark:bg-[#1E3E2F] dark:text-[#D1F2E2] flex items-center justify-between text-xs font-black shadow-[0_3px_8px_rgba(80,120,95,0.25),inset_0_1.5px_2px_rgba(255,255,255,0.7)] border border-white/60 dark:border-white/10">
                  <div className="flex flex-col text-left">
                    <span className="text-[12px] font-black uppercase tracking-wider text-[#082216] dark:text-[#A7E2C7]">
                      Active Conversations
                    </span>
                    <span className="text-[11px] font-bold text-[#143B2A] dark:text-[#88C4A9]">
                      Project: Articulate &nbsp;•&nbsp; Client: Studio K
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-extrabold bg-[#85AA93] dark:bg-[#284E3C] px-2.5 py-1 rounded-full text-white shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span>12 Users Online</span>
                  </div>
                </div>

                {/* Conversation Flow */}
                <div className="space-y-4 py-2 flex-1">
                  {/* User Message (Terracotta 3D Clay Bubble with speech tail) */}
                  <div className="space-y-1 text-left">
                    <div className="text-[11px] font-bold text-[#735A4D] dark:text-[#A8988B] px-1">
                      <span>{currentScenario.senderName}</span>
                    </div>
                    <div className="inline-block max-w-[88%] pl-2">
                      <div className="clay-bubble-terracotta p-3.5 sm:p-4 text-xs sm:text-sm font-bold leading-relaxed [word-spacing:0.035em]">
                        {currentScenario.userMessage}
                      </div>
                    </div>
                  </div>

                  {/* flayre.ai AI Response (Sage 3D Clay Bubble with speech tail) */}
                  <div className="space-y-1 text-right">
                    <div className="text-[11px] font-bold text-[#3B6652] dark:text-[#7EB59E] px-1 flex items-center justify-end gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D36A48]" />
                      <span>flayre.ai</span>
                    </div>
                    <div className="inline-block max-w-[90%] pr-2 text-left">
                      <div className="clay-bubble-sage p-3.5 sm:p-4 text-xs sm:text-sm font-bold leading-relaxed [word-spacing:0.035em] relative group">
                        <p>{currentScenario.tones[activeTone]}</p>

                        {/* Copy Response Quick Button */}
                        <button
                          onClick={handleCopy}
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/85 dark:bg-black/50 text-[10px] font-black text-[#0A261A] dark:text-[#D1F2E2] shadow-sm flex items-center gap-1 hover:bg-white transition cursor-pointer"
                          title="Copy this reply"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-[#8C7B6D] dark:text-[#7D6E60] px-2 pt-0.5">
                      11:02 AM
                    </div>
                  </div>

                  {/* Extra Custom Messages if typed */}
                  {activeMessages.map((m, idx) => (
                    <div key={idx} className={`space-y-1 ${m.isAi ? "text-right" : "text-left"}`}>
                      <span className="text-[10px] font-bold text-[#735A4D] dark:text-[#A8988B] px-1 block">
                        {m.sender}
                      </span>
                      <div
                        className={`p-3 text-xs font-bold leading-relaxed [word-spacing:0.03em] inline-block max-w-[88%] ${
                          m.isAi ? "clay-bubble-sage text-left pr-2" : "clay-bubble-terracotta text-left pl-2"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Sculpted Input Pill */}
                <form onSubmit={handleSendCustom} className="flex items-center gap-2 pt-2 border-t border-[#EAE0D4] dark:border-[#2C241D]">
                  <div className="flex-1 flex items-center rounded-full bg-white dark:bg-[#201A15] border border-[#D8CABE] dark:border-[#382E25] px-3.5 py-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),0_1px_1px_#FFF]">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Start typing..."
                      className="w-full bg-transparent text-xs font-medium outline-none text-[#14100D] dark:text-[#FAF6F0]"
                    />
                    <button
                      type="button"
                      className="text-base text-[#D36A48] hover:scale-110 transition px-1 cursor-pointer"
                      title="Emoji stamp"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="clay-btn-sage px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 transition cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>

              {/* ============================================================================ */}
              {/* Right Column: User Profile, Action Pills & Response Tone Slider */}
              {/* ============================================================================ */}
              <div className="lg:col-span-3 space-y-3.5 flex flex-col justify-between">
                {/* User Profile Card */}
                <div className="clay-slab p-3.5 space-y-2 text-xs">
                  <div className="border-b border-[#E6DDD0] dark:border-[#2E251E] pb-2">
                    <h4 className="font-black text-[#14100D] dark:text-[#FAF6F0] text-xs">User Profile</h4>
                    <p className="text-[10px] font-bold text-[#735A4D] dark:text-[#A8988B]">(Sarah)</p>
                  </div>

                  <div className="space-y-1 text-[11px] font-bold text-[#574B3F] dark:text-[#C5B8A8]">
                    <p>
                      Name: <span className="text-[#14100D] dark:text-[#FAF6F0]">Sarah</span>
                    </p>
                    <p>
                      Status: <span className="text-[#14100D] dark:text-[#FAF6F0]">Articulate</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      Status: <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-[#14100D] dark:text-[#FAF6F0]">Ready</span>
                    </p>
                  </div>
                </div>

                {/* Studio Action Buttons Stack */}
                <div className="space-y-2">
                  <Link
                    href="/analyze"
                    className="clay-btn-sage w-full py-2.5 px-4 text-xs font-black rounded-full flex items-center justify-between shadow-md hover:scale-102 transition"
                  >
                    <span>New Chat</span>
                    <Plus className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="clay-btn-porcelain w-full py-2.5 px-4 text-xs font-bold rounded-full flex items-center justify-center shadow-xs hover:scale-102 transition"
                  >
                    <span>Templates</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="clay-btn-porcelain w-full py-2.5 px-4 text-xs font-bold rounded-full flex items-center justify-center shadow-xs hover:scale-102 transition"
                  >
                    <span>Insights</span>
                  </Link>
                </div>

                {/* Response Tone Ceramic Slider directly in Right Column */}
                <div className="clay-slab p-3 pt-3.5 space-y-2">
                  <ClayToneSlider
                    tones={TONE_OPTIONS}
                    activeTone={activeTone}
                    onChange={(tone) => setActiveTone(tone)}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
