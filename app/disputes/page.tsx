"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/wallet-context";

type DisputeSummary = {
  escrow_id: number;
  milestone_index: number;
  opened_by_wallet: string;
  resolved: boolean;
  outcome: string;
  renter_wallet: string;
  host_wallet: string;
};

export default function Disputes() {
  const { publicKey } = useWallet();
  const [disputes, setDisputes] = useState<DisputeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setDisputes(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setDisputes(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes?wallet=${publicKey}`)
      .then((res) => {
        if (!res.ok) throw new Error(`failed to load disputes (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDisputes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "failed to load disputes");
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div>
        <h1>Disputes</h1>
        <p>Connect your wallet to see disputes you&apos;ve opened or are party to.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Disputes</h1>
      {error && <p style={{ color: "#b00020" }}>{error}</p>}
      {!error && disputes === null && <p>Loading…</p>}
      {disputes?.length === 0 && <p>No disputes yet.</p>}
      <ul>
        {disputes?.map((d) => (
          <li key={d.escrow_id}>
            <a href={`/disputes/${d.escrow_id}`}>
              Escrow #{d.escrow_id} — milestone {d.milestone_index} —{" "}
              {d.resolved ? d.outcome : "voting open"}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
