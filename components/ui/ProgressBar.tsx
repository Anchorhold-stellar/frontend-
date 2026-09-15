export function ProgressBar({ fraction }: { fraction: number }) {
  const percent = Math.min(100, Math.max(0, Math.round(fraction * 100)));
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        background: "var(--color-neutral-bg)",
        borderRadius: 999,
        height: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          background: "var(--color-success)",
          height: "100%",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}
