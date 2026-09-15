import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavWallet } from "./NavWallet";
import { ToastProvider } from "../lib/toast-context";
import { useWallet } from "../lib/wallet-context";

vi.mock("../lib/wallet-context", () => ({
  useWallet: vi.fn(),
}));

const useWalletMock = vi.mocked(useWallet);

function baseState() {
  return {
    publicKey: null as string | null,
    connecting: false,
    error: null as string | null,
    notInstalled: false,
    network: null,
    networkMismatch: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

describe("NavWallet", () => {
  it("shows a Connect wallet button when disconnected", () => {
    useWalletMock.mockReturnValue(baseState());
    render(<NavWallet />);
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
  });

  it("calls connect when the button is clicked", async () => {
    const state = baseState();
    useWalletMock.mockReturnValue(state);
    render(<NavWallet />);
    await userEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(state.connect).toHaveBeenCalledOnce();
  });

  it("disables the button and shows Connecting… while connecting", () => {
    useWalletMock.mockReturnValue({ ...baseState(), connecting: true });
    render(<NavWallet />);
    expect(screen.getByRole("button", { name: "Connecting…" })).toBeDisabled();
  });

  it("shows an install link when Freighter isn't installed", () => {
    useWalletMock.mockReturnValue({
      ...baseState(),
      error: "Freighter is not installed",
      notInstalled: true,
    });
    render(<NavWallet />);
    expect(screen.getByRole("link", { name: "Install Freighter" })).toHaveAttribute(
      "href",
      "https://www.freighter.app/"
    );
    expect(screen.queryByText("Freighter is not installed")).not.toBeInTheDocument();
  });

  it("shows the raw error text for other connect failures", () => {
    useWalletMock.mockReturnValue({ ...baseState(), error: "something else broke" });
    render(<NavWallet />);
    expect(screen.getByText("something else broke")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Install Freighter" })).not.toBeInTheDocument();
  });

  it("shows the truncated address and a disconnect button when connected", async () => {
    const state = { ...baseState(), publicKey: "GADDRESS1234567890ABCDEF" };
    useWalletMock.mockReturnValue(state);
    render(
      <ToastProvider>
        <NavWallet />
      </ToastProvider>
    );

    expect(screen.getByText("GADD…CDEF")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(state.disconnect).toHaveBeenCalledOnce();
  });
});
