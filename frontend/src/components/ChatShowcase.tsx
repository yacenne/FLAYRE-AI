"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Flame,
  Copy,
  Check,
  Sparkles,
  Heart,
  Zap,
  Smile,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

interface Scenario {
  id: string;
  tabLabel: string;
  platform: string;
  senderName: string;
  senderAvatar: string;
  incomingText: string;
  time: string;
  dynamics: {
    emotion: string;
    subtext: string;
    urgency: string;
  };
  suggestions: {
    tone: "warm" | "direct" | "playful";
    label: string;
    badgeColor: string;
    icon: any;
    text: string;
    why: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "ghosted",
    tabLabel: "Ghosted / Reconnection",
    platform: "WhatsApp",
    senderName: "Alex",
    senderAvatar: "A",
    incomingText: "Hey stranger, sorry for disappearing! Things got crazy busy this week. How are you doing?",
    time: "10:42 AM",
    dynamics: {
      emotion: "Guilty & friendly",
      subtext: "Testing waters after absence",
      urgency: "Normal",
    },
    suggestions: [
      {
        tone: "warm",
        label: "Warm",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        icon: Heart,
        text: "No worries at all! Life gets wild sometimes. I've been doing great—let's grab coffee when things settle down for you.",
        why: "Low pressure, validates busy schedule, opens door to meet.",
      },
      {
        tone: "direct",
        label: "Direct",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Zap,
        text: "All good, Alex. Doing well here! Free to catch up for 15 mins this Thursday afternoon?",
        why: "Sets a specific, low-friction time without playing games.",
      },
      {
        tone: "playful",
        label: "Playful",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Smile,
        text: "Look who surfaced! I'll let you off the hook this time 😉 How was the eye of the storm?",
        why: "Light teasing builds chemistry and removes any awkwardness.",
      },
    ],
  },
  {
    id: "banter",
    tabLabel: "Playful Banter",
    platform: "Instagram DM",
    senderName: "Maya",
    senderAvatar: "M",
    incomingText: "So do you always take 3 hours to reply or am I just getting special treatment? 🧐",
    time: "2:15 PM",
    dynamics: {
      emotion: "Flirty & teasing",
      subtext: "High interest, seeking playful validation",
      urgency: "High engagement",
    },
    suggestions: [
      {
        tone: "playful",
        label: "Playful",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Smile,
        text: "Quality responses take craftsmanship! Don't tell me you were staring at the typing dots the whole time 😉",
        why: "Flips the frame playfully and dials up chemistry.",
      },
      {
        tone: "warm",
        label: "Warm",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        icon: Heart,
        text: "Haha caught me during a packed afternoon! Definitely worth the wait though. How's your day going?",
        why: "Reassures interest warmly while acknowledging the delay.",
      },
      {
        tone: "direct",
        label: "Direct",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Zap,
        text: "Just wrapped up work! Let's skip the slow texting—grab a quick drink tomorrow at 7?",
        why: "Bold move that transitions from texting to a real-life date.",
      },
    ],
  },
  {
    id: "invite",
    tabLabel: "Weekend Plans",
    platform: "iMessage",
    senderName: "Jordan",
    senderAvatar: "J",
    incomingText: "Hey! What are you up to this weekend? Any fun plans?",
    time: "6:30 PM",
    dynamics: {
      emotion: "Curious & open",
      subtext: "Hinting at wanting to hang out",
      urgency: "Medium",
    },
    suggestions: [
      {
        tone: "warm",
        label: "Warm",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        icon: Heart,
        text: "Hey! Mostly keeping it relaxed—farmers market on Saturday and catching up on rest. What are you thinking?",
        why: "Friendly and leaves space for them to pitch an idea.",
      },
      {
        tone: "direct",
        label: "Direct",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Zap,
        text: "Open Saturday evening! I've been wanting to try that new rooftop spot downtown. Want to check it out together?",
        why: "Clear plan, decisive, and easy to say yes to.",
      },
      {
        tone: "playful",
        label: "Playful",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Smile,
        text: "That depends... are you inviting me to something exciting, or just being nosy? 😉",
        why: "Banter that playfully forces them to make the invitation.",
      },
    ],
  },
];

export function ChatShowcase() {
  const [activeScenarioId, setActiveScenarioId] = useState("ghosted");
  const [copiedTone, setCopiedTone] = useState<string | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const handleCopy = (tone: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Simple Scenario Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 max-w-xl mx-auto border border-slate-200 dark:border-slate-700/60">
        {SCENARIOS.map((s) => {
          const active = s.id === scenario.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveScenarioId(s.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 ${
                active
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {s.tabLabel}
            </button>
          );
        })}
      </div>

      {/* Main Preview Container */}
      <div className="grid lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm">
        
        {/* Left Column: Simulated Chat Screenshot */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {scenario.senderAvatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {scenario.senderName}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {scenario.platform}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Chat Bubble Canvas */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3 min-h-[160px] flex flex-col justify-center">
              <div className="self-start max-w-[85%] bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1">
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                  {scenario.incomingText}
                </p>
                <div className="text-[10px] text-slate-400 text-right font-medium">
                  {scenario.time}
                </div>
              </div>
            </div>

            {/* Detected AI Dynamics */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5238]" />
                <span>AI Emotion & Context Detection</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Detected Emotion</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                    {scenario.dynamics.emotion}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Subtext</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                    {scenario.dynamics.subtext}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/analyze"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Try with your own screenshot</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FF5238]" />
          </Link>
        </div>

        {/* Right Column: 3 Smart Suggestions */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Generated Smart Replies
            </h3>
            <span className="text-xs text-slate-400">Click to copy reply</span>
          </div>

          <div className="space-y-3">
            {scenario.suggestions.map((item) => {
              const Icon = item.icon;
              const isCopied = copiedTone === item.tone;

              return (
                <div
                  key={item.tone}
                  onClick={() => handleCopy(item.tone, item.text)}
                  className="group relative p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-150 cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.badgeColor}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </span>

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        isCopied
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-[#FF5238] group-hover:text-white"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>

                  <div className="text-[11px] text-slate-500 font-normal border-t border-slate-100 dark:border-slate-700/60 pt-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Why this works: </span>
                    {item.why}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
