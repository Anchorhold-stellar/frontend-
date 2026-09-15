"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/wallet-context";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";

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
        <EmptyState>Connect your wallet to see escrows you&apos;re renting or hosting.</EmptyState>
      </div>
    );
  }

  return (
    <div>
      <h1>Your escrows</h1>
      {error && <p style={{ color: "#b00020" }}>{error}</p>}
      {!error && escrows === null && <Spinner label="Loading escrows…" />}
      {escrows?.length === 0 && <EmptyState>No escrows yet.</EmptyState>}
      {escrows?.map((e) => (
        <Card key={e.escrow_id}>
          <a href={`/escrow/${e.escrow_id}`} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Escrow #{e.escrow_id} — {e.total_amount}
              {e.host_wallet === publicKey ? " (hosting)" : " (renting)"}
            </span>
            <StatusBadge status={e.status} />
          </a>
        </Card>
      ))}
    </div>
  );
}
