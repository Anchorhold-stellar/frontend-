import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-card-border)",
        background: "var(--color-card-bg)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
