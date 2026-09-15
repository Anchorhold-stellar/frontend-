export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-muted)" }}>
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid var(--color-secondary-border)",
          borderTopColor: "var(--color-fg)",
          animation: "safetrust-spin 0.7s linear infinite",
        }}
      />
      <span>{label}</span>
      <style>{`@keyframes safetrust-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
