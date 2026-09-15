"use client";

import { useToast } from "../../lib/toast-context";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast("Copied to clipboard", "success");
    } catch {
      toast("Couldn't copy to clipboard", "error");
    }
  }

  return (
    <button
      onClick={copy}
      title={`Copy ${value}`}
      style={{
        border: "none",
        background: "none",
        cursor: "pointer",
        color: "var(--color-muted)",
        fontSize: 12,
        padding: 0,
        textDecoration: "underline",
      }}
    >
      {label}
    </button>
  );
}
