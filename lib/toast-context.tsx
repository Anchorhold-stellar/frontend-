"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_COLOR_VARS: Record<ToastKind, string> = {
  success: "var(--color-success)",
  error: "var(--color-danger)",
  info: "var(--color-info)",
};

const DISMISS_AFTER_MS = 5000;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = nextId++;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 1000,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              background: "var(--color-card-bg)",
              border: `1px solid ${KIND_COLOR_VARS[t.kind]}`,
              color: KIND_COLOR_VARS[t.kind],
              borderRadius: 6,
              padding: "10px 14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              maxWidth: 320,
              fontSize: 14,
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
