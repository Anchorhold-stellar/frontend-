"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/wallet-context";

type EscrowSummary = {
  escrow_id: number;
  status: string;
  total_amount: string;
  renter_wallet: string;
  host_wallet: string;
};

export default function Dashboard() {
  const { publicKey } = useWallet();
  const [escrows, setEscrows] = useState<EscrowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setEscrows(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setEscrows(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows?wallet=${publicKey}`)
      .then((res) => {
        if (!res.ok) throw new Error(`failed to load escrows (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setEscrows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "failed to load escrows");
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div>
        <h1>Your escrows</h1>
        <p>Connect your wallet to see escrows you&apos;re renting or hosting.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Your escrows</h1>
      {error && <p style={{ color: "#b00020" }}>{error}</p>}
      {!error && escrows === null && <p>Loading…</p>}
      {escrows?.length === 0 && <p>No escrows yet.</p>}
      <ul>
        {escrows?.map((e) => (
          <li key={e.escrow_id}>
            <a href={`/escrow/${e.escrow_id}`}>
              Escrow #{e.escrow_id} — {e.status} — {e.total_amount}
              {e.host_wallet === publicKey ? " (hosting)" : " (renting)"}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
