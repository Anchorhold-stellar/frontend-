"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/wallet-context";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { useDocumentTitle } from "../../lib/use-document-title";
import { formatRelativeTime } from "../../lib/format";

type DisputeSummary = {
  escrow_id: number;
  milestone_index: number;
  opened_by_wallet: string;
  opened_at: string;
  resolved: boolean;
  outcome: string;
  renter_wallet: string;
  host_wallet: string;
};

export default function Disputes() {
  useDocumentTitle("Disputes");
  const { publicKey } = useWallet();
  const [disputes, setDisputes] = useState<DisputeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

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
  }, [publicKey, reloadToken]);

  if (!publicKey) {
    return (
      <div>
        <h1>Disputes</h1>
        <EmptyState>Connect your wallet to see disputes you&apos;ve opened or are party to.</EmptyState>
      </div>
    );
  }

  return (
    <div>
      <h1>Disputes</h1>
      {error && (
        <p style={{ color: "var(--color-danger)", display: "flex", gap: 8, alignItems: "center" }}>
          {error}
          <Button variant="secondary" onClick={() => setReloadToken((t) => t + 1)}>
            Retry
          </Button>
        </p>
      )}
      {!error && disputes === null && <Spinner label="Loading disputes…" />}
      {disputes?.length === 0 && <EmptyState>No disputes yet.</EmptyState>}
      {disputes?.map((d) => (
        <Card key={d.escrow_id}>
          <a
            href={`/disputes/${d.escrow_id}`}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>
              Escrow #{d.escrow_id} — milestone {d.milestone_index}{" "}
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                ({formatRelativeTime(d.opened_at)})
              </span>
            </span>
            <Badge tone={d.resolved ? "success" : "warning"}>
              {d.resolved ? d.outcome : "voting open"}
            </Badge>
          </a>
        </Card>
      ))}
    </div>
  );
}
