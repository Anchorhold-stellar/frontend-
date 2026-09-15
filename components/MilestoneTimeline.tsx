import { Button } from "./ui/Button";

type Milestone = {
  milestone_index: number;
  description: string;
  amount: string;
  released: boolean;
  auto_release_at: string | null;
};

export function MilestoneTimeline({
  milestones,
  onConfirm,
  confirmingIndex,
}: {
  milestones: Milestone[];
  onConfirm?: (milestoneIndex: number) => void;
  confirmingIndex?: number | null;
}) {
  return (
    <ol style={{ listStyle: "none", padding: 0 }}>
      {milestones.map((m) => (
        <li
          key={m.milestone_index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>{m.description}</strong>
            <div style={{ fontSize: 13, color: "#666" }}>
              {m.released
                ? "Released"
                : m.auto_release_at
                ? `Auto-releases ${new Date(m.auto_release_at).toLocaleString()}`
                : "Pending deposit"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>{m.amount}</span>
            {!m.released && onConfirm && (
              <Button
                variant="secondary"
                onClick={() => onConfirm(m.milestone_index)}
                disabled={confirmingIndex === m.milestone_index}
              >
                {confirmingIndex === m.milestone_index ? "Confirming…" : "Confirm & release"}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
