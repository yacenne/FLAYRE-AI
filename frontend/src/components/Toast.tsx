"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-[0_10px_24px_-4px_rgba(180,160,140,0.35),inset_0_2px_3px_rgba(255,255,255,0.95)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-white/90 dark:border-[#382F26] transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              toast.type === "success"
                ? "bg-[#EDF7F2] dark:bg-[#152B20] text-[#1A4031] dark:text-[#A8E6CF]"
                : toast.type === "error"
                ? "bg-[#FCEAE6] dark:bg-[#341812] text-[#6E2A19] dark:text-[#FCA5A5]"
                : "bg-[#FFFDF9] dark:bg-[#1E1A16] text-[#332A24] dark:text-[#FAF6F0]"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-[#D97757] dark:text-[#F87171] shrink-0 mt-0.5" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-[#679AB8] dark:text-[#7DD3FC] shrink-0 mt-0.5" />}

            <p className="text-xs font-semibold leading-snug flex-1">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#968A7F] dark:text-[#A09282] hover:text-[#27221E] dark:hover:text-[#FAF6F0] transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
