"use client";

import { useWallet } from "../lib/wallet-context";

export function NetworkBanner() {
  const { publicKey, network, networkMismatch } = useWallet();

  if (!publicKey || !networkMismatch) return null;

  return (
    <div
      style={{
        background: "var(--color-warning-bg)",
        color: "var(--color-warning)",
        padding: "8px 24px",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      Freighter is connected to <strong>{network}</strong>, which doesn&apos;t match the network
      this app expects. Switch networks in Freighter before signing anything.
    </div>
  );
}
