import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MilestoneTimeline } from "./MilestoneTimeline";

const MILESTONES = [
  {
    milestone_index: 0,
    description: "Move-in",
    amount: "1000",
    released: true,
    auto_release_at: null,
  },
  {
    milestone_index: 1,
    description: "Move-out",
    amount: "2000",
    released: false,
    auto_release_at: new Date(Date.now() + 86_400_000).toISOString(),
  },
];

describe("MilestoneTimeline", () => {
  it("renders each milestone's description and formatted amount", () => {
    render(<MilestoneTimeline milestones={MILESTONES} />);
    expect(screen.getByText("Move-in")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("Move-out")).toBeInTheDocument();
    expect(screen.getByText("2,000")).toBeInTheDocument();
  });

  it("shows Released for a released milestone", () => {
    render(<MilestoneTimeline milestones={MILESTONES} />);
    expect(screen.getByText("Released")).toBeInTheDocument();
  });

  it("shows a pending-deposit message when there's no auto-release date", () => {
    render(
      <MilestoneTimeline
        milestones={[
          { milestone_index: 0, description: "First", amount: "500", released: false, auto_release_at: null },
        ]}
      />
    );
    expect(screen.getByText("Pending deposit")).toBeInTheDocument();
  });

  it("does not render a confirm button when onConfirm is omitted", () => {
    render(<MilestoneTimeline milestones={MILESTONES} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("only renders a confirm button for the unreleased milestone", () => {
    render(<MilestoneTimeline milestones={MILESTONES} onConfirm={() => {}} />);
    expect(screen.getAllByRole("button", { name: "Confirm & release" })).toHaveLength(1);
  });

  it("calls onConfirm with the milestone's index when clicked", async () => {
    const onConfirm = vi.fn();
    render(<MilestoneTimeline milestones={MILESTONES} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm & release" }));
    expect(onConfirm).toHaveBeenCalledWith(1);
  });

  it("shows a confirming state and disables the button for the matching index", () => {
    render(<MilestoneTimeline milestones={MILESTONES} onConfirm={() => {}} confirmingIndex={1} />);
    const button = screen.getByRole("button", { name: "Confirming…" });
    expect(button).toBeDisabled();
  });
});
