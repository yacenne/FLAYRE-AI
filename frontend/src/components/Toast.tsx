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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl shadow-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-white border-emerald-300 text-slate-800"
                : toast.type === "error"
                ? "bg-white border-rose-300 text-slate-800"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-blue-600 shrink-0" />}

            <p className="text-xs font-semibold leading-snug flex-1">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
