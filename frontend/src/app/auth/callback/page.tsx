"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const supabase = createClient(supabaseUrl, supabaseAnonKey);

                // Get the session from URL hash (Supabase puts tokens there after OAuth)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                if (session) {
                    // Store in localStorage for backward compatibility
                    localStorage.setItem("access_token", session.access_token);
                    localStorage.setItem("user", JSON.stringify({
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name,
                    }));

                    // Redirect to dashboard
                    router.push("/dashboard");
                } else {
                    // No session, try to exchange code if present
                    const url = new URL(window.location.href);
                    const code = url.searchParams.get("code");

                    if (code) {
                        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                        if (exchangeError) {
                            throw exchangeError;
                        }

                        if (data.session) {
                            localStorage.setItem("access_token", data.session.access_token);
                            localStorage.setItem("user", JSON.stringify({
                                id: data.session.user.id,
                                email: data.session.user.email,
                                full_name: data.session.user.user_metadata?.full_name,
                            }));
                            router.push("/dashboard");
                        }
                    } else {
                        // No code and no session, redirect to login
                        router.push("/login");
                    }
                }
            } catch (err: any) {
                console.error("Auth callback error:", err);
                setError(err.message || "Authentication failed");
                // Wait a bit then redirect to login
                setTimeout(() => router.push("/login"), 3000);
            }
        };

        handleCallback();
    }, [router]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
                <div className="glass rounded-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Authentication Error</h1>
                    <p className="text-neutral-400 mb-4">{error}</p>
                    <p className="text-sm text-neutral-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center animate-pulse mx-auto mb-4">
                    <span className="text-3xl">🔥</span>
                </div>
                <p className="text-white text-lg mb-2">Completing sign in...</p>
                <p className="text-neutral-400 text-sm">Please wait while we verify your account</p>
            </div>
        </div>
    );
}
