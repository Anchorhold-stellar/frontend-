type Tone = "neutral" | "success" | "warning" | "danger";

const TONE_COLORS: Record<Tone, { background: string; color: string }> = {
  neutral: { background: "#f0f0f0", color: "#444" },
  success: { background: "#e6f4ea", color: "#1a7f37" },
  warning: { background: "#fff4e5", color: "#946200" },
  danger: { background: "#fbe9e9", color: "#b00020" },
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
