"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Flame, AlertCircle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Get the session from URL hash
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          localStorage.setItem("access_token", session.access_token);
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name,
            })
          );
          router.push("/dashboard");
        } else {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");

          if (code) {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              throw exchangeError;
            }

            if (data.session) {
              localStorage.setItem("access_token", data.session.access_token);
              localStorage.setItem(
                "user",
                JSON.stringify({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  full_name: data.session.user.user_metadata?.full_name,
                })
              );
              router.push("/dashboard");
            }
          } else {
            router.push("/login");
          }
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="clay-card p-8 max-w-md text-center space-y-3 bg-white shadow-md border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Authentication Error</h1>
          <p className="text-xs text-slate-500">{error}</p>
          <p className="text-xs text-slate-400 font-mono">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FF5238] flex items-center justify-center mx-auto shadow-md shadow-[#FF5238]/30 animate-pulse">
          <Flame className="w-7 h-7 text-white fill-white" />
        </div>
        <p className="text-slate-900 font-bold text-base">Verifying authentication...</p>
        <p className="text-slate-500 text-xs">Please wait while we secure your session</p>
      </div>
    </div>
  );
}
