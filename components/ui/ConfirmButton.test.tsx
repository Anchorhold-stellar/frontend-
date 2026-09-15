import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmButton } from "./ConfirmButton";

describe("ConfirmButton", () => {
  it("does not call onConfirm on the first click, and shows the confirm label", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton onConfirm={onConfirm}>Remove</ConfirmButton>);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Click again to confirm" })).toBeInTheDocument();
  });

  it("calls onConfirm on the second click", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton onConfirm={onConfirm}>Remove</ConfirmButton>);

    const button = screen.getByRole("button", { name: "Remove" });
    await userEvent.click(button);
    await userEvent.click(screen.getByRole("button", { name: "Click again to confirm" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("supports a custom confirm label", async () => {
    render(<ConfirmButton onConfirm={() => {}} confirmLabel="Really discard?">Discard</ConfirmButton>);
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByRole("button", { name: "Really discard?" })).toBeInTheDocument();
  });

  it("reverts to the unarmed label after the timeout elapses", () => {
    vi.useFakeTimers();
    render(<ConfirmButton onConfirm={() => {}}>Remove</ConfirmButton>);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("button", { name: "Click again to confirm" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
