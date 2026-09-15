"use client";

import { useWallet } from "../lib/wallet-context";

export function NavWallet() {
  const { publicKey, connecting, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <button onClick={disconnect} title="Disconnect wallet">
        {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
      </button>
    );
  }

  return (
    <button onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
