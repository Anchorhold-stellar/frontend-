type Tone = "neutral" | "success" | "warning" | "danger";

const TONE_COLORS: Record<Tone, { background: string; color: string }> = {
  neutral: { background: "var(--color-neutral-bg)", color: "var(--color-neutral-fg)" },
  success: { background: "var(--color-success-bg)", color: "var(--color-success)" },
  warning: { background: "var(--color-warning-bg)", color: "var(--color-warning)" },
  danger: { background: "var(--color-danger-bg)", color: "var(--color-danger)" },
};

const STATUS_TONES: Record<string, Tone> = {
  created: "neutral",
  active: "success",
  disputed: "danger",
  completed: "success",
  cancelled: "warning",
};

export function Badge({ children, tone = "neutral" }: { children: string; tone?: Tone }) {
  const colors = TONE_COLORS[tone];
  return (
    <span
      style={{
        ...colors,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{status}</Badge>;
}
