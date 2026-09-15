"use client";

import { useWallet } from "../lib/wallet-context";
import { Button } from "./ui/Button";

export function NavWallet() {
  const { publicKey, connecting, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <Button variant="secondary" onClick={disconnect} title="Disconnect wallet">
        {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect wallet"}
    </Button>
  );
}
