"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getAccessToken } from "@/context/AuthContext";
import { initiateProUpgrade } from "@/lib/razorpay";

export interface UseProUpgradeOptions {
    redirectPath?: string;
    onCompleted?: () => void;
}

export function useProUpgrade(options: UseProUpgradeOptions = {}) {
    const { redirectPath = "/pricing", onCompleted } = options;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const handleUpgrade = useCallback(async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);

        const token = getAccessToken();

        if (!token || !isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(redirectPath)}&plan=pro`);
            setLoading(false);
            return;
        }

        await initiateProUpgrade({
            token,
            userEmail: user?.email,
            userName: user?.full_name,
            onSuccess: (data) => {
                setLoading(false);
                setSuccess("🎉 Success! You have upgraded to flayre.ai Pro!");
                if (onCompleted) {
                    onCompleted();
                }
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1500);
            },
            onError: (errMessage) => {
                setLoading(false);
                setError(errMessage);
            },
            onDismiss: () => {
                setLoading(false);
            },
        });
    }, [isAuthenticated, onCompleted, redirectPath, router, user?.email, user?.full_name]);

    const clearError = useCallback(() => setError(null), []);
    const clearSuccess = useCallback(() => setSuccess(null), []);

    return {
        loading,
        error,
        success,
        handleUpgrade,
        clearError,
        clearSuccess,
    };
}
