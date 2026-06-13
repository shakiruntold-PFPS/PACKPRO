"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle };
const COLORS = {
  success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", icon: "#10b981" },
  error:   { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  icon: "#ef4444" },
  info:    { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", icon: "#60a5fa" },
  warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", icon: "#f59e0b" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.slice(-4), { id, type, title, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((title: string, msg?: string) => toast("success", title, msg), [toast]);
  const error   = useCallback((title: string, msg?: string) => toast("error",   title, msg), [toast]);
  const info    = useCallback((title: string, msg?: string) => toast("info",    title, msg), [toast]);
  const warning = useCallback((title: string, msg?: string) => toast("warning", title, msg), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          const c = COLORS[t.type];
          return (
            <div key={t.id}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl min-w-[280px] max-w-[360px]"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                backdropFilter: "blur(20px)",
                animation: "slideInRight .25s ease",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}>
              <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: c.icon }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{t.title}</div>
                {t.message && <div className="text-xs mt-0.5" style={{ color: "#8ba5c8" }}>{t.message}</div>}
              </div>
              <button onClick={() => remove(t.id)} className="flex-shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: "#8ba5c8" }}>
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
