/**
 * Razorpay Integration Helper for flayre.ai
 */

export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void | Promise<void>;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => {
            open: () => void;
        };
    }
}

/**
 * Dynamically load the Razorpay SDK script.
 * Handles stale/failed script elements gracefully.
 */
export function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === "undefined") {
            resolve(false);
            return;
        }

        if (window.Razorpay) {
            resolve(true);
            return;
        }

        // Remove any existing stale or failed script elements
        const existingScript = document.getElementById("razorpay-sdk");
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement("script");
        script.id = "razorpay-sdk";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => {
            script.remove();
            resolve(false);
        };
        document.body.appendChild(script);
    });
}

export interface InitiateCheckoutArgs {
    token: string;
    userEmail?: string;
    userName?: string;
    onSuccess: (data: any) => void;
    onError: (errorMsg: string) => void;
    onDismiss?: () => void;
}

/**
 * Initiate Razorpay upgrade flow:
 * 1. Calls backend /api/v1/billing/create-order
 * 2. Loads Razorpay checkout JS
 * 3. Opens Razorpay modal
 * 4. On payment completion, verifies signature via /api/v1/billing/verify-payment
 */
function formatErrorDetail(detail: any): string {
    if (!detail) return "Unknown error occurred";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(", ");
    }
    if (typeof detail === "object") {
        return detail.message || detail.error || JSON.stringify(detail);
    }
    return String(detail);
}

export async function initiateProUpgrade({
    token,
    userEmail,
    userName,
    onSuccess,
    onError,
    onDismiss,
}: InitiateCheckoutArgs): Promise<void> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // 1. Create order on backend
        const res = await fetch(`${apiUrl}/api/v1/billing/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ plan: "pro" }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = formatErrorDetail(errData.detail || errData.message) || "Failed to create payment order";
            throw new Error(errMsg);
        }

        const orderData = await res.json();

        if (orderData.already_pro) {
            onSuccess(orderData);
            return;
        }

        const { order_id, amount, currency, key_id } = orderData;
        const razorpayKey = key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        if (!razorpayKey) {
            throw new Error("Razorpay Key ID is not configured. Please contact support.");
        }

        // 2. Load SDK
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            throw new Error("Failed to load Razorpay SDK script. Please check your internet connection.");
        }

        // 3. Configure Razorpay modal
        const options: RazorpayOptions = {
            key: razorpayKey,
            amount,
            currency,
            name: "flayre.ai",
            description: "Pro Plan Upgrade - Unlimited AI Analyses",
            order_id,
            prefill: {
                email: userEmail || "",
                name: userName || "",
            },
            theme: {
                color: "#FF5238", // Brand terracotta/orange
            },
            handler: async (response: RazorpayResponse) => {
                try {
                    // 4. Verify payment on backend
                    const verifyRes = await fetch(`${apiUrl}/api/v1/billing/verify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: "pro",
                        }),
                    });

                    const verifyData = await verifyRes.json().catch(() => ({}));

                    if (!verifyRes.ok) {
                        const errMsg = formatErrorDetail(verifyData.detail || verifyData.message) || "Server verification failed";
                        throw new Error(errMsg);
                    }

                    onSuccess(verifyData);
                } catch (err: any) {
                    const paymentIdInfo = response.razorpay_payment_id
                        ? ` (Payment ID: ${response.razorpay_payment_id})`
                        : "";
                    let detail = err.message || "Server verification failed";
                    if (detail === "Failed to fetch" || err.name === "TypeError") {
                        detail = `Network error connecting to backend (${apiUrl})`;
                    }
                    onError(
                        `Your payment succeeded on Razorpay${paymentIdInfo}, but server verification failed: ${detail}. If your plan is not upgraded shortly, please contact support@flayre.ai with your Payment ID.`
                    );
                }
            },
            modal: {
                ondismiss: () => {
                    if (onDismiss) onDismiss();
                },
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err: any) {
        let msg = err.message || "Something went wrong during checkout.";
        if (msg === "Failed to fetch" || err.name === "TypeError") {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            msg = `Unable to connect to backend server (${apiUrl}). Please ensure the backend is running.`;
        }
        onError(msg);
    }
}
