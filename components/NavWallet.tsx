"use client";

import { useWallet } from "../lib/wallet-context";
import { Button } from "./ui/Button";
import { CopyButton } from "./ui/CopyButton";

export function NavWallet() {
  const { publicKey, connecting, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>
          {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
        </span>
        <CopyButton value={publicKey} />
        <Button variant="secondary" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect wallet"}
    </Button>
  );
}
