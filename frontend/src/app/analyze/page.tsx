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
    reader.onload = () => {
      setImage(reader.result as string);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  }, [showToast]);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            showToast("Screenshot pasted from clipboard!", "success");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile, showToast]);

  const handleAnalyze = async () => {
    if (!image) {
      showToast("Please select or paste a screenshot first", "error");
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
      loadUsage();
      showToast("Analysis complete!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to analyze screenshot", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = async (resp: AIResponse) => {
    try {
      await navigator.clipboard.writeText(resp.content);
      setCopiedId(resp.id);
      showToast("Copied to clipboard!", "success");

      if (analysis?.id) {
        api.conversations.markCopied(analysis.id, resp.id).catch(() => {});
      }

      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5238] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPro = usage ? usage.analyses_limit > 1000 : false;
  const remaining = usage?.analyses_remaining ?? 10;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row max-w-[1600px] mx-auto transition-colors duration-200">
      {/* Sidebar */}
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
            
            {/* Left Column: Dropzone & Settings */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Dropzone Card */}
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
                className={`clay-card p-6 min-h-[340px] flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all relative overflow-hidden bg-white dark:bg-slate-900 ${
                  isDragging
                    ? "border-[#FF5238] bg-orange-50/60 dark:bg-orange-950/20 shadow-md"
                    : image
                    ? "border-transparent"
                    : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                {image ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img
                      src={image}
                      alt="Uploaded screenshot"
                      className="max-h-[360px] w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center mx-auto text-[#FF5238]">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Drop conversation screenshot here
                      </p>
                      <p className="text-xs text-slate-500">or click to browse files</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                      <kbd className="text-[#FF5238] font-bold">Ctrl+V</kbd>
                      <span>to paste directly</span>
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

              {/* Settings Card */}
              <div className="clay-card p-5 space-y-4 bg-white dark:bg-slate-900">
                {/* Platform Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Chat Platform
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "whatsapp", label: "WhatsApp" },
                      { id: "instagram", label: "Instagram" },
                      { id: "discord", label: "Discord" },
                      { id: "other", label: "Other / SMS" },
                    ].map((p) => {
                      const selected = platform === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlatform(p.id as Platform)}
                          className={`p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center border ${
                            selected
                              ? "bg-[#FF5238] text-white border-[#FF5238] shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Context Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Optional Context</span>
                    <span className="text-[10px] text-slate-400 font-normal">e.g. goal or vibe</span>
                  </label>
                  <input
                    type="text"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="e.g. Keep it chill, don't sound eager, ask for Saturday"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF5238] focus:bg-white transition"
                    maxLength={140}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!image || analyzing || (usage !== null && usage.analyses_remaining <= 0)}
                  className="clay-btn-primary w-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 rounded-xl disabled:opacity-40 shadow-md"
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Vision AI Reading Screenshot...</span>
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

            {/* Right Column: Suggested Responses */}
            <div className="lg:col-span-7 space-y-4">
              {analysis ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Context Summary Card */}
                  <div className="clay-card p-5 space-y-3 bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Detected Context & Tone
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                        {analysis.platform}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {analysis.context.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {analysis.context.tone && (
                        <span className="clay-badge-terracotta">
                          Tone: {analysis.context.tone}
                        </span>
                      )}
                      {analysis.context.emotional_state && (
                        <span className="clay-badge-honey">
                          Emotion: {analysis.context.emotional_state}
                        </span>
                      )}
                      {analysis.context.relationship_type && (
                        <span className="clay-badge-denim">
                          Dynamics: {analysis.context.relationship_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Response Tiles (Warm, Direct, Playful) */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                      Generated Smart Replies
                    </h3>

                    {analysis.responses.map((resp) => {
                      const isCopied = copiedId === resp.id;
                      const isWarm = resp.tone.toLowerCase() === "warm";
                      const isPlayful = resp.tone.toLowerCase() === "playful";

                      const TileIcon = isWarm ? Heart : isPlayful ? Smile : Zap;
                      const badgeClasses = isWarm
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isPlayful
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200";

                      return (
                        <div
                          key={resp.id}
                          className="clay-card p-5 space-y-3.5 bg-white dark:bg-slate-900 hover:border-slate-300 transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses}`}>
                              <TileIcon className="w-3.5 h-3.5" />
                              <span className="capitalize">{resp.tone}</span>
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {resp.character_count || resp.content.length} chars
                            </span>
                          </div>

                          <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                            &ldquo;{resp.content}&rdquo;
                          </p>

                          <button
                            onClick={() => handleCopy(resp)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${
                              isCopied
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                                : "clay-btn-secondary"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
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
                    })}
                  </div>

                  <button
                    onClick={clearImage}
                    className="clay-btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Another Screenshot</span>
                  </button>
                </div>
              ) : (
                /* Empty Ready State */
                <div className="clay-card p-12 text-center min-h-[440px] flex flex-col items-center justify-center space-y-4 bg-white dark:bg-slate-900">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <FileImage className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to Analyze</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload or paste your conversation screenshot on the left to receive three tailor-made responses calibrated for Warmth, Directness, and Playfulness.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="clay-badge-terracotta">Warm</span>
                    <span className="clay-badge-denim">Direct</span>
                    <span className="clay-badge-honey">Playful</span>
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
