"use client";

import { useEffect, useState } from "react";
import { checkRpcHealth } from "../lib/wallet";

const POLL_INTERVAL_MS = 30000;

export function RpcStatus() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const result = await checkRpcHealth();
      if (!cancelled) setHealthy(result);
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (healthy === null) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--color-muted)",
      }}
      title={healthy ? "Soroban RPC is reachable" : "Soroban RPC is unreachable"}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: healthy ? "var(--color-success)" : "var(--color-danger)",
        }}
      />
      RPC {healthy ? "online" : "unreachable"}
    </span>
  );
}
