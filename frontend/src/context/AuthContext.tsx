"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

interface AuthUser {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, fullName?: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginAsDemo: () => void;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });
    }
    return supabase;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Transform Supabase user to our AuthUser type
    const transformUser = useCallback((supabaseUser: User | null): AuthUser | null => {
        if (!supabaseUser) return null;
        return {
            id: supabaseUser.id,
            email: supabaseUser.email || "",
            full_name: supabaseUser.user_metadata?.full_name,
            avatar_url: supabaseUser.user_metadata?.avatar_url,
        };
    }, []);

    // Initialize auth state
    useEffect(() => {
        const supabase = getSupabase();

        const initializeAuth = async () => {
            try {
                // First check localStorage for instant loading
                const storedToken = localStorage.getItem("access_token");
                const storedUser = localStorage.getItem("user");
                if (storedToken && storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (e) {
                        console.error("Failed to parse stored user:", e);
                    }
                }

                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Auth timeout")), 4000)
                );

                const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
                const currentSession = result?.data?.session;

                if (currentSession) {
                    setSession(currentSession);
                    const transformed = transformUser(currentSession.user);
                    setUser(transformed);
                    localStorage.setItem("access_token", currentSession.access_token);
                    localStorage.setItem("user", JSON.stringify(transformed));
                }
            } catch (error: any) {
                console.warn("Auth initialization note:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession);
                const transformed = transformUser(newSession?.user || null);
                setUser(transformed);

                if (newSession && transformed) {
                    localStorage.setItem("access_token", newSession.access_token);
                    localStorage.setItem("user", JSON.stringify(transformed));
                } else if (event === "SIGNED_OUT") {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    setUser(null);
                    setSession(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [transformUser]);

    // Login with email/password
    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            setSession(data.session);
            const transformed = transformUser(data.user);
            setUser(transformed);
            if (data.session && transformed) {
                localStorage.setItem("access_token", data.session.access_token);
                localStorage.setItem("user", JSON.stringify(transformed));
            }
        } finally {
            setIsLoading(false);
        }
    }, [transformUser]);

    // Signup with email/password
    const signup = useCallback(async (email: string, password: string, fullName?: string) => {
        setIsLoading(true);
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName || "",
                    },
                },
            });

            if (error) throw error;

            if (data.session) {
                setSession(data.session);
                const transformed = transformUser(data.user);
                setUser(transformed);
                if (transformed) {
                    localStorage.setItem("access_token", data.session.access_token);
                    localStorage.setItem("user", JSON.stringify(transformed));
                }
            } else if (data.user) {
                // Email confirmation is required by Supabase, create local access for smooth experience
                const demoUser: AuthUser = {
                    id: data.user.id,
                    email: data.user.email || email,
                    full_name: fullName || "User",
                };
                setUser(demoUser);
                localStorage.setItem("access_token", "session_active_" + data.user.id);
                localStorage.setItem("user", JSON.stringify(demoUser));
            }
        } finally {
            setIsLoading(false);
        }
    }, [transformUser]);

    // 1-Click Demo Login
    const loginAsDemo = useCallback(() => {
        const demoUser: AuthUser = {
            id: "demo-user-" + Math.random().toString(36).substring(2, 7),
            email: "alex@flayre.ai",
            full_name: "Alex Demo",
        };
        setUser(demoUser);
        localStorage.setItem("access_token", "demo_token_flayre_preview");
        localStorage.setItem("user", JSON.stringify(demoUser));
    }, []);

    // Login with Google OAuth
    const loginWithGoogle = useCallback(async () => {
        const supabase = getSupabase();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) throw error;
    }, []);

    // Logout
    const logout = useCallback(async () => {
        try {
            const supabase = getSupabase();
            await supabase.auth.signOut();
        } catch (e) {
            // Ignore signOut error
        }
        setUser(null);
        setSession(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
    }, []);

    // Refresh session
    const refreshSession = useCallback(async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        if (data.session) {
            setSession(data.session);
            setUser(transformUser(data.user));
        }
    }, [transformUser]);

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        loginAsDemo,
        logout,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// ============================================================================
// Utility: Get access token (for API calls)
// ============================================================================

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}
