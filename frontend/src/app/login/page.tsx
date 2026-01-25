"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Loading component for Suspense fallback
function LoginLoading() {
    return (
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center animate-pulse mx-auto mb-4">
                    <span className="text-2xl">🔥</span>
                </div>
                <p className="text-neutral-400">Loading...</p>
            </div>
        </div>
    );
}

// Inner component that uses useSearchParams
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, signup, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{
        email?: string;
        password?: string;
        fullName?: string;
    }>({});
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            const redirectTo = searchParams.get("redirect") || "/dashboard";
            router.push(redirectTo);
        }
    }, [isAuthenticated, authLoading, router, searchParams]);

    // Validate form fields
    const validateForm = (): boolean => {
        const errors: typeof fieldErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            errors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!formData.password) {
            errors.password = "Password is required";
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        }

        // Full name validation (only for signup)
        if (!isLogin && !formData.fullName.trim()) {
            errors.fullName = "Full name is required";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setFieldErrors({});

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await signup(formData.email, formData.password, formData.fullName);
            }

            // Redirect will happen via useEffect when isAuthenticated changes
            const redirectTo = searchParams.get("redirect") || "/dashboard";
            router.push(redirectTo);
        } catch (err: any) {
            // Parse Supabase error messages
            let errorMessage = err.message || "Something went wrong";

            if (errorMessage.includes("Invalid login credentials")) {
                errorMessage = "Invalid email or password";
            } else if (errorMessage.includes("User already registered")) {
                errorMessage = "An account with this email already exists";
            } else if (errorMessage.includes("Email not confirmed")) {
                errorMessage = "Please check your email to confirm your account";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            await loginWithGoogle();
            // Redirect happens automatically via Supabase OAuth flow
        } catch (err: any) {
            setError(err.message || "Google sign-in failed");
        }
    };

    // Show loading while checking auth
    if (authLoading) {
        return <LoginLoading />;
    }

    return (
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                        <span className="text-2xl">🔥</span>
                    </div>
                    <span className="text-2xl font-bold text-white">flayre.ai</span>
                </Link>

                {/* Card */}
                <div className="glass rounded-2xl p-8">
                    {/* Toggle */}
                    <div className="flex rounded-xl bg-neutral-800/50 p-1 mb-8">
                        <button
                            onClick={() => {
                                setIsLogin(true);
                                setError("");
                                setFieldErrors({});
                            }}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition ${isLogin ? "bg-gradient-hero text-white" : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => {
                                setIsLogin(false);
                                setError("");
                                setFieldErrors({});
                            }}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition ${!isLogin ? "bg-gradient-hero text-white" : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fullName: e.target.value });
                                        if (fieldErrors.fullName) {
                                            setFieldErrors({ ...fieldErrors, fullName: undefined });
                                        }
                                    }}
                                    className={`input text-neutral-900 placeholder-neutral-400 ${fieldErrors.fullName ? "border-red-500 focus:ring-red-500" : ""
                                        }`}
                                    placeholder="John Doe"
                                />
                                {fieldErrors.fullName && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.fullName}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (fieldErrors.email) {
                                        setFieldErrors({ ...fieldErrors, email: undefined });
                                    }
                                }}
                                className={`input text-neutral-900 placeholder-neutral-400 ${fieldErrors.email ? "border-red-500 focus:ring-red-500" : ""
                                    }`}
                                placeholder="you@example.com"
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (fieldErrors.password) {
                                        setFieldErrors({ ...fieldErrors, password: undefined });
                                    }
                                }}
                                className={`input text-neutral-900 placeholder-neutral-400 ${fieldErrors.password ? "border-red-500 focus:ring-red-500" : ""
                                    }`}
                                placeholder="••••••••"
                                minLength={8}
                            />
                            {fieldErrors.password && (
                                <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-transparent text-neutral-500">or continue with</span>
                        </div>
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 rounded-xl border border-neutral-700 text-white hover:bg-neutral-800/50 transition flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    {/* Terms */}
                    <p className="text-center text-sm text-neutral-500 mt-6">
                        By continuing, you agree to our{" "}
                        <a href="#" className="text-purple-400 hover:underline">Terms</a> and{" "}
                        <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>
                    </p>
                </div>

                {/* Back Link */}
                <p className="text-center mt-6">
                    <Link href="/" className="text-neutral-400 hover:text-white transition flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to home
                    </Link>
                </p>
            </div>
        </div>
    );
}

// Main page component with Suspense wrapper
export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}
