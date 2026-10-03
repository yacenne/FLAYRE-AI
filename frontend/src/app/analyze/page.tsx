"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import type { AnalyzeResponse, AIResponse, UsageInfo, Platform } from "@/types";
import {
  UploadCloud,
  Sparkles,
  Copy,
  Check,
  X,
  Heart,
  Zap,
  Smile,
  MessageSquare,
  FileImage,
  RefreshCw,
  Camera,
} from "lucide-react";

export default function AnalyzePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [image, setImage] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("whatsapp");
  const [additionalContext, setAdditionalContext] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsage = useCallback(async () => {
    try {
      const data = await api.analyze.getUsage();
      setUsage(data);
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/analyze");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsage();
    }
  }, [isAuthenticated, loadUsage]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file (PNG, JPG, WebP)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be under 10MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  }, [showToast]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            showToast("Screenshot pasted from clipboard!", "info");
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFile, showToast]);

  const handleAnalyze = async () => {
    if (!image) {
      showToast("Please upload or paste a screenshot first", "error");
      return;
    }

    if (usage && usage.analyses_remaining <= 0) {
      showToast("Monthly limit reached. Please upgrade to Pro for unlimited analyses.", "error");
      router.push("/pricing");
      return;
    }

    setAnalyzing(true);

    try {
      const base64 = image.includes(",") ? image.split(",")[1] : image;
      const result = await api.analyze.analyzeScreenshot({
        screenshot: base64,
        platform,
        context: additionalContext.trim() || undefined,
      });

      setAnalysis(result);
      showToast("Analysis complete!", "success");
      await loadUsage();
    } catch (err: any) {
      showToast(err.message || "Analysis failed. Please try again.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = async (response: AIResponse) => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopiedId(response.id);
      showToast("Copied to clipboard!", "success");

      if (analysis?.id) {
        api.conversations.markCopied(analysis.id, response.id).catch(() => {});
      }

      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis(null);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--clay-bg)] flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-3 border-[#D97757] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPro = usage ? usage.analyses_limit > 1000 : false;
  const remaining = usage?.analyses_remaining ?? 10;

  return (
    <div className="min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text-primary)] flex flex-col lg:flex-row max-w-[1600px] mx-auto">
      {/* Left Sage Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar remainingCredits={remaining} isPro={isPro} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Navbar
          title="Analyze Screenshot"
          remainingCredits={remaining}
          isPro={isPro}
        />

        <main className="px-4 sm:px-6 space-y-6 flex-1">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* ============================================================================ */}
            {/* Left Column: Dropzone & Settings */}
            {/* ============================================================================ */}
            <div className="lg:col-span-5 space-y-5">
              {/* Cozy Clay Upload Dropzone */}
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onClick={() => !image && fileInputRef.current?.click()}
                className={`clay-card p-6 min-h-[350px] flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all relative overflow-hidden ${
                  isDragging
                    ? "border-[#D36A48] bg-[#FBECE6] dark:bg-[#32231C]"
                    : image
                    ? "border-transparent bg-[#FFFFFF] dark:bg-[#1C1916]"
                    : "border-[#B5A593] dark:border-[#3D352D] bg-[#FFFFFF] dark:bg-[#1C1916] hover:border-[#D36A48] hover:bg-[#FFFDF9] dark:hover:bg-[#221E1A]"
                }`}
              >
                {image ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img
                      src={image}
                      alt="Uploaded screenshot"
                      className="max-h-[360px] w-auto object-contain rounded-2xl shadow-md border border-[#EAE0D4] dark:border-[#352E26]"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-[#FFFFFF] dark:bg-[#25201A] text-[#D36A48] hover:bg-[#FCEAE6] dark:hover:bg-[#362620] shadow-[0_3px_8px_rgba(125,95,75,0.25)] flex items-center justify-center transition border border-[#E2D7C8] dark:border-[#3E342B]"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pointer-events-none">
                    <div className="clay-tile clay-tile-sage w-14 h-14 mx-auto">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-black text-[#14100D] dark:text-[#FAF6F0]">
                        Drop your screenshot here
                      </p>
                      <p className="text-xs font-bold text-[#4A3E33] dark:text-[#B5A593]">or click to browse files</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAE1D5] dark:bg-[#25201A] text-xs font-black text-[#211A14] dark:text-[#E8DFD1] shadow-inner border border-[#D5C8B8] dark:border-[#382F26]">
                      <kbd className="font-mono text-[#D36A48] font-black">Ctrl+V</kbd>
                      <span>to paste from clipboard</span>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Platform & Options Clay Card */}
              <div className="clay-card p-5 space-y-4">
                {/* Platform Selector Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#29211A] dark:text-[#E8DFD1]">Chat Platform</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "whatsapp", label: "WhatsApp", color: "clay-tile-sage" },
                      { id: "instagram", label: "Instagram", color: "clay-tile-terracotta" },
                      { id: "discord", label: "Discord", color: "clay-tile-denim" },
                      { id: "other", label: "Other", color: "clay-tile-honey" },
                    ].map((p) => {
                      const selected = platform === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlatform(p.id as Platform)}
                          className={`p-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 border ${
                            selected
                              ? "bg-[#FFFFFF] dark:bg-[#2A231C] text-[#14100D] dark:text-[#FAF6F0] shadow-[0_4px_12px_rgba(125,95,75,0.22),inset_0_1px_2px_#FFF] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.06)] border-[#D36A48] border-2"
                              : "bg-[#EFE8DC] dark:bg-[#241F1A] text-[#3D3228] dark:text-[#C5B8A8] border-[#DCD0C1] dark:border-[#332A22] hover:bg-[#E5DCCE] dark:hover:bg-[#2C2620]"
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${p.color}`} />
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Context Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#29211A] dark:text-[#E8DFD1] flex items-center justify-between">
                    <span>Optional Context</span>
                    <span className="text-[11px] font-bold text-[#5C4F42] dark:text-[#9A8A7A]">e.g., tone goal</span>
                  </label>
                  <input
                    type="text"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="e.g. Want to sound friendly but decline invitation"
                    className="clay-input text-xs"
                    maxLength={120}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!image || analyzing || (usage !== null && usage.analyses_remaining <= 0)}
                  className="clay-btn clay-btn-primary w-full py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2 rounded-2xl shadow-lg disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Vision AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate 3 Response Tones</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ============================================================================ */}
            {/* Right Column: Suggested Responses */}
            {/* ============================================================================ */}
            <div className="lg:col-span-7 space-y-5">
              {analysis ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Context Summary Card */}
                  <div className="clay-card-sage p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#0A261A]" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#0A261A]">
                          Context Analysis
                        </h3>
                      </div>
                      <span className="clay-badge clay-badge-sage text-[10px] capitalize">
                        {analysis.platform}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-[#0E281D] leading-relaxed">
                      {analysis.context.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 border-t border-black/10">
                      {analysis.context.tone && (
                        <span className="clay-badge clay-badge-terracotta">
                          Tone: {analysis.context.tone}
                        </span>
                      )}
                      {analysis.context.emotional_state && (
                        <span className="clay-badge clay-badge-honey">
                          Emotion: {analysis.context.emotional_state}
                        </span>
                      )}
                      {analysis.context.relationship_type && (
                        <span className="clay-badge clay-badge-denim">
                          {analysis.context.relationship_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Response Tiles (Warm, Direct, Playful) */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#29211A] dark:text-[#E8DFD1]">
                      Choose Your Response Style
                    </h3>

                    {analysis.responses.map((resp) => {
                      const isCopied = copiedId === resp.id;
                      const isWarm = resp.tone.toLowerCase() === "warm";
                      const isPlayful = resp.tone.toLowerCase() === "playful";

                      const cardClass = isWarm
                        ? "clay-card-terracotta"
                        : isPlayful
                        ? "clay-card-honey"
                        : "clay-card-denim";

                      const TileIcon = isWarm ? Heart : isPlayful ? Smile : Zap;
                      const tileClass = isWarm
                        ? "clay-tile-terracotta"
                        : isPlayful
                        ? "clay-tile-honey"
                        : "clay-tile-denim";

                      return (
                        <div key={resp.id} className={`${cardClass} p-5 sm:p-6 space-y-4`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`clay-tile ${tileClass} w-8 h-8`}>
                                <TileIcon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-[#1E1712] dark:text-[#FAF6F0]">
                                {resp.tone} Tone
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[#40352B] dark:text-[#C5B8A8]">
                              {resp.character_count || resp.content.length} chars
                            </span>
                          </div>

                          <p className="text-sm sm:text-base font-bold text-[#14100D] dark:text-[#FAF6F0] leading-relaxed [word-spacing:0.035em]">
                            {resp.content}
                          </p>

                          <button
                            onClick={() => handleCopy(resp)}
                            className={`clay-btn w-full text-xs py-2.5 transition font-bold rounded-xl ${
                              isCopied
                                ? "bg-[#CEE7DC] dark:bg-[#1A382B] text-[#07261A] dark:text-[#D1F2E2] shadow-sm border border-[#ACD6C2] dark:border-[#2D5A47]"
                                : "clay-btn-secondary"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                                <span>Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Response</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={clearImage}
                    className="clay-btn clay-btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 font-black"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Start New Screenshot Analysis</span>
                  </button>
                </div>
              ) : (
                /* Empty Ready State */
                <div className="clay-card p-12 text-center min-h-[440px] flex flex-col items-center justify-center space-y-4">
                  <div className="clay-tile clay-tile-sage w-16 h-16 mx-auto">
                    <FileImage className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-base font-black text-[#14100D] dark:text-[#FAF6F0]">Ready to analyze</h3>
                    <p className="text-xs font-bold text-[#4A3E33] dark:text-[#B5A593] leading-relaxed">
                      Upload or paste your conversation screenshot on the left to get 3 tailor-made responses in different tones.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="clay-badge clay-badge-terracotta">Warm</span>
                    <span className="clay-badge clay-badge-denim">Direct</span>
                    <span className="clay-badge clay-badge-honey">Playful</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
