import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px dashed var(--color-secondary-border)",
        borderRadius: 8,
        padding: 24,
        textAlign: "center",
        color: "var(--color-muted)",
      }}
    >
      {children}
    </div>
  );
}
