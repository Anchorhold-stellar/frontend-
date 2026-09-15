import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "./CopyButton";
import { ToastProvider } from "../../lib/toast-context";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("CopyButton", () => {
  it("renders the default label", () => {
    renderWithToast(<CopyButton value="hello" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    renderWithToast(<CopyButton value="hello" label="Copy link" />);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("writes the value to the clipboard and shows a success toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderWithToast(<CopyButton value="copy-me" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("copy-me");
    expect(await screen.findByText("Copied to clipboard")).toBeInTheDocument();
  });

  it("shows an error toast when the clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });

    renderWithToast(<CopyButton value="copy-me" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(await screen.findByText("Couldn't copy to clipboard")).toBeInTheDocument();
  });
});
