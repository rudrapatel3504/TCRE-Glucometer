"use client";

import React from "react";
import { useTCREStore } from "../../store/useTCREStore";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export default function CustomToaster() {
  const toasts = useTCREStore((state) => state.toasts);
  const dismissToast = useTCREStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const bgClass =
          toast.type === "success"
            ? "bg-emerald-500 text-white dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-600/20"
            : toast.type === "error"
            ? "bg-rose-500 text-white dark:bg-rose-950 dark:text-rose-300 border border-rose-600/20"
            : "bg-slate-800 text-white dark:bg-slate-900 dark:text-slate-200 border border-slate-700/50";

        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 transform transition-all duration-300 translate-y-0 animate-in slide-in-from-bottom-4 ${bgClass}`}
          >
            <div className="flex gap-2.5 items-start mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {toast.type === "info" && <Info className="w-4 h-4 flex-shrink-0" />}
              <span className="text-xs font-medium leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/80 hover:text-white dark:text-text-secondary dark:hover:text-text-primary p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
