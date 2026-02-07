"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, getAccessToken } from "@/context/AuthContext";

interface AnalysisContext {
    summary: string;
    tone: string;
    emotional_state: string;
}

interface AIResponse {
    id: string;
    tone: string;
    content: string;
    character_count: number;
}

interface AnalyzeResponse {
    context: AnalysisContext;
    responses: AIResponse[];
}

interface UsageInfo {
    analyses_used: number;
    analyses_limit: number;
    analyses_remaining: number;
}

export default function AnalyzePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [platform, setPlatform] = useState("whatsapp");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login?redirect=/analyze");
        }
    }, [isAuthenticated, authLoading, router]);

    // Load usage on mount
    useEffect(() => {
        if (isAuthenticated) {
            loadUsage();
        }
    }, [isAuthenticated]);

    // Handle paste from clipboard
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
                    }
                    break;
                }
            }
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, []);

    const loadUsage = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = getAccessToken();
        if (!token) return;

        try {
            const res = await fetch(`${apiUrl}/api/v1/billing/subscription`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const sub = await res.json();
                setUsage(sub.usage);
            }
        } catch (err) {
            console.error("Failed to load usage:", err);
        }
    };

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        setImageFile(file);
        setError(null);
        setAnalysis(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            setImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleAnalyze = async () => {
        if (!image || !imageFile) {
            setError("Please upload a screenshot first");
            return;
        }

        if (usage && usage.analyses_remaining <= 0) {
            setError("No analyses remaining. Please upgrade to Pro!");
            return;
        }

        setAnalyzing(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = getAccessToken();

        try {
            // Convert image to base64 without the data URL prefix
            const base64 = image.split(",")[1];

            const res = await fetch(`${apiUrl}/api/v1/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    screenshot: base64,
                    platform: platform,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || `Analysis failed (${res.status})`);
            }

            const result = await res.json();
            setAnalysis(result);
            await loadUsage();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Analysis failed";
            setError(message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopy = async (response: AIResponse) => {
        try {
            await navigator.clipboard.writeText(response.content);
            setCopiedId(response.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const clearImage = () => {
        setImage(null);
        setImageFile(null);
        setAnalysis(null);
        setError(null);
    };

    const getToneIcon = (tone: string) => {
        const icons: Record<string, string> = {
            warm: "💜",
            direct: "⚡",
            playful: "🎈",
        };
        return icons[tone.toLowerCase()] || "💬";
    };

    const getToneGradient = (tone: string) => {
        const gradients: Record<string, string> = {
            warm: "from-purple-500 to-pink-500",
            direct: "from-blue-500 to-cyan-500",
            playful: "from-orange-500 to-yellow-500",
        };
        return gradients[tone.toLowerCase()] || "from-gray-500 to-gray-600";
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center animate-pulse mx-auto mb-4">
                        <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-neutral-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-dark">
            {/* Header */}
            <header className="glass-dark border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                                <span className="text-xl">🔥</span>
                            </div>
                            <span className="text-xl font-bold text-white">flayre.ai</span>
                        </Link>

                        {usage && (
                            <div className="flex items-center gap-3">
                                <div className="glass rounded-full px-4 py-2">
                                    <span className="text-white font-semibold">
                                        {usage.analyses_remaining}
                                    </span>
                                    <span className="text-neutral-400 ml-1">
                                        / {usage.analyses_limit === 999999 ? "∞" : usage.analyses_limit} left
                                    </span>
                                </div>
                                <Link href="/dashboard" className="btn btn-ghost text-sm text-white">
                                    Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                        Analyze Conversation
                    </h1>
                    <p className="text-neutral-400">
                        Upload or paste a screenshot to get AI-powered response suggestions
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Upload Area */}
                    <div className="space-y-6">
                        {/* Upload Zone */}
                        <div
                            ref={dropZoneRef}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => !image && fileInputRef.current?.click()}
                            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                ${isDragging
                                    ? "border-purple-400 bg-purple-500/20 scale-[1.02]"
                                    : image
                                        ? "border-white/20 bg-white/5"
                                        : "border-white/20 bg-white/5 hover:border-purple-400 hover:bg-purple-500/10"
                                }
              `}
                            style={{ minHeight: "400px" }}
                        >
                            {image ? (
                                <div className="relative h-full">
                                    <img
                                        src={image}
                                        alt="Screenshot"
                                        className="w-full h-full object-contain rounded-xl"
                                        style={{ maxHeight: "500px" }}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mb-6 backdrop-blur-sm">
                                        <svg className="w-10 h-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-xl font-semibold text-white mb-2">
                                        Drop screenshot here
                                    </p>
                                    <p className="text-neutral-400 text-center mb-4">
                                        or click to browse files
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                                        <kbd className="px-2 py-1 rounded bg-white/10 text-neutral-300 font-mono">
                                            Ctrl+V
                                        </kbd>
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

                        {/* Platform & Analyze */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="flex-1 glass rounded-xl px-4 py-3 text-white bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none transition"
                            >
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="instagram">📸 Instagram</option>
                                <option value="discord">🎮 Discord</option>
                                <option value="telegram">✈️ Telegram</option>
                                <option value="imessage">💬 iMessage</option>
                                <option value="other">💭 Other</option>
                            </select>

                            <button
                                onClick={handleAnalyze}
                                disabled={!image || analyzing || (usage?.analyses_remaining ?? 0) <= 0}
                                className="flex-1 btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨ Analyze</span>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-red-300 flex items-start gap-3">
                                <span className="text-xl">⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Results */}
                    <div className="space-y-6">
                        {analysis ? (
                            <>
                                {/* Context Card */}
                                <div className="glass rounded-2xl p-6 border border-white/10">
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <span>📊</span> Context Analysis
                                    </h3>
                                    <p className="text-neutral-300 mb-4 leading-relaxed">
                                        {analysis.context.summary}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="badge badge-primary">
                                            {analysis.context.tone}
                                        </span>
                                        <span className="badge badge-pro">
                                            {analysis.context.emotional_state}
                                        </span>
                                    </div>
                                </div>

                                {/* Response Cards */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <span>✨</span> Suggested Responses
                                    </h3>

                                    {analysis.responses.map((response) => (
                                        <div
                                            key={response.id}
                                            className="group glass rounded-xl p-5 border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{getToneIcon(response.tone)}</span>
                                                    <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${getToneGradient(response.tone)} capitalize`}>
                                                        {response.tone}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-neutral-500">
                                                    {response.character_count} chars
                                                </span>
                                            </div>

                                            <p className="text-white text-lg leading-relaxed mb-4">
                                                {response.content}
                                            </p>

                                            <button
                                                onClick={() => handleCopy(response)}
                                                className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2
                          ${copiedId === response.id
                                                        ? "bg-green-500 text-white"
                                                        : "bg-white/10 hover:bg-white/20 text-white"
                                                    }`}
                                            >
                                                {copiedId === response.id ? (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        Copy Response
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Analyze Again */}
                                <button
                                    onClick={clearImage}
                                    className="w-full btn btn-secondary"
                                >
                                    🔄 Start New Analysis
                                </button>
                            </>
                        ) : (
                            /* Empty State */
                            <div className="glass rounded-2xl p-8 border border-white/10 text-center h-full flex flex-col items-center justify-center" style={{ minHeight: "500px" }}>
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                                    <span className="text-5xl">💬</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Ready to Analyze
                                </h3>
                                <p className="text-neutral-400 max-w-sm">
                                    Upload a screenshot of your conversation and get AI-powered response suggestions in 3 different tones
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <span className="badge badge-primary">💜 Warm</span>
                                    <span className="badge badge-primary">⚡ Direct</span>
                                    <span className="badge badge-primary">🎈 Playful</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
