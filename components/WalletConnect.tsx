"use client";

import { useWallet } from "../lib/wallet-context";

export function WalletConnect() {
  const { publicKey, connecting, error, notInstalled, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <p>
        Connected: {publicKey.slice(0, 6)}…{publicKey.slice(-4)}{" "}
        <button onClick={disconnect}>Disconnect</button>
      </p>
    );
  }

  return (
    <div>
      <button onClick={connect} disabled={connecting}>
        {connecting ? "Connecting…" : "Connect Freighter"}
      </button>
      {error && (
        <p style={{ color: "var(--color-danger)" }}>
          {error}
          {notInstalled && (
            <>
              {" — "}
              <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
                install Freighter
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
