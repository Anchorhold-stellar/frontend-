import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px dashed #ddd",
        borderRadius: 8,
        padding: 24,
        textAlign: "center",
        color: "#666",
      }}
    >
      {children}
    </div>
  );
}
