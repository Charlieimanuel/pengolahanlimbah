"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { toast, ToastItem } from "@/lib/toast";

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = toast.subscribe((newItems) => {
      setItems(newItems);
    });
    return () => unsubscribe();
  }, []);

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed z-120 top-4 inset-x-3 sm:inset-x-auto sm:right-5 sm:top-5 flex flex-col gap-2.5 max-w-sm w-full mx-auto sm:mx-0 pointer-events-none"
    >
      {items.map((item) => {
        const isSuccess = item.type === "success";
        const isError = item.type === "error";
        const isWarning = item.type === "warning";

        const bgClass = isSuccess
          ? "bg-[#0b2b1e] border-emerald-500/40 text-white"
          : isError
          ? "bg-[#331111] border-rose-500/40 text-white"
          : isWarning
          ? "bg-[#33250b] border-amber-500/40 text-white"
          : "bg-[#0f2233] border-sky-500/40 text-white";

        const iconBgClass = isSuccess
          ? "bg-emerald-500/25 text-emerald-300"
          : isError
          ? "bg-rose-500/25 text-rose-300"
          : isWarning
          ? "bg-amber-500/25 text-amber-300"
          : "bg-sky-500/25 text-sky-300";

        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.22)] border flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3 backdrop-blur-md ${bgClass}`}
          >
            {/* Visual Status Icon */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}
            >
              {isSuccess && <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />}
              {isError && <AlertCircle className="w-4.5 h-4.5 stroke-[2.2]" />}
              {isWarning && <AlertTriangle className="w-4.5 h-4.5 stroke-[2.2]" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4.5 h-4.5 stroke-[2.2]" />}
            </div>

            {/* Toast Title and Description */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="text-xs sm:text-sm font-bold leading-snug">
                {item.title}
              </div>
              {item.description && (
                <div className="text-[11px] sm:text-xs text-white/85 mt-0.5 leading-relaxed">
                  {item.description}
                </div>
              )}
            </div>

            {/* Quick Dismiss Button */}
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0 -mr-1 -mt-1"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export default Toaster;
