"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Flame, Headphones, ArrowRight, AlertCircle, Mail, Lock, User } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.fullName);
      }
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    } catch (err: any) {
      let msg = err.message || "Authentication failed. Please check your credentials.";
      if (msg.includes("Invalid login credentials")) {
        msg = "Invalid email or password";
      } else if (msg.includes("User already registered")) {
        msg = "An account with this email already exists";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign in");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* 3D Flame Mascot Header */}
      <div className="text-center space-y-3">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group">
          <div className="w-16 h-16 rounded-3xl bg-[#FFFFFF] dark:bg-[#25201A] shadow-[0_8px_18px_rgba(211,106,72,0.35),inset_0_2px_4px_#FFF] dark:shadow-[0_8px_18px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.06)] border border-[#E2D7C8] dark:border-[#3E342B] flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-[#D36A48] via-[#E28E6E] to-[#F8D57E] flex items-center justify-center relative shadow-inner">
              <Flame className="w-8 h-8 text-white drop-shadow-md" />
              <Headphones className="w-10 h-10 text-[#102B20] absolute -top-0.5 opacity-95" />
            </div>
          </div>
          <span className="font-extrabold text-2xl tracking-normal text-[#14100D] dark:text-[#FAF6F0]">
            flayre<span className="text-[#D36A48]">.ai</span>
          </span>
        </Link>
        <p className="text-xs font-bold text-[#4A3E33] dark:text-[#B5A593]">
          {isLogin
            ? "Sign in to access your cozy conversation dashboard"
            : "Get started with 10 free AI conversation analyses every month"}
        </p>
      </div>

      {/* Auth Card */}
      <div className="clay-card p-6 sm:p-8 space-y-5">
        {/* Toggle between Sign In & Sign Up */}
        <div className="flex rounded-2xl bg-[#EAE0D4] dark:bg-[#151210] p-1 shadow-inner border border-[#D5C8B8] dark:border-[#2D251E]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              isLogin ? "clay-nav-active" : "text-[#4A3E33] dark:text-[#A89A8A] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              !isLogin ? "clay-nav-active" : "text-[#4A3E33] dark:text-[#A89A8A] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="clay-btn clay-btn-secondary w-full justify-center text-xs py-2.5 flex items-center gap-2.5 font-black"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#EAE0D4] dark:border-[#352E26]" />
          <span className="bg-[#FFFFFF] dark:bg-[#1C1916] px-3 text-[11px] font-black text-[#574B3F] dark:text-[#A09282] uppercase tracking-wider absolute">
            Or with email
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#FCEAE6] dark:bg-[#2A1612] border border-[#F5C2B6] dark:border-[#4E241B] text-[#6E1C07] dark:text-[#FCA5A5] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D36A48]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-black text-[#29211A] dark:text-[#E8DFD1]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#635548] dark:text-[#8E7E70] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="clay-input pl-10 py-2 text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black text-[#29211A] dark:text-[#E8DFD1]">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#635548] dark:text-[#8E7E70] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="clay-input pl-10 py-2 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-[#29211A] dark:text-[#E8DFD1]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#635548] dark:text-[#8E7E70] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="clay-input pl-10 py-2 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="clay-btn clay-btn-primary w-full inline-flex items-center justify-center gap-2 text-xs py-3.5 font-bold shadow-lg rounded-2xl disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] font-bold text-[#574B3F] dark:text-[#8E7E70]">
        Protected by Supabase Auth & Vision AI security.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text-primary)] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-9 h-9 rounded-full border-3 border-[#D97757] border-t-transparent animate-spin" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
