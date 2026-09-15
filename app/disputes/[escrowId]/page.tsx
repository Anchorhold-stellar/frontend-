"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../../lib/wallet-context";
import { useToast } from "../../../lib/toast-context";
import { signAndSubmit } from "../../../lib/wallet";
import { Button } from "../../../components/ui/Button";
import { CopyButton } from "../../../components/ui/CopyButton";

type Evidence = {
  id: string;
  submitted_by: string;
  uri: string;
  note: string | null;
  created_at: string;
};

type DisputeDetail = {
  escrow_id: number;
  milestone_index: number;
  opened_by_wallet: string;
  resolved: boolean;
  outcome: string;
  opened_at: string;
  evidence: Evidence[];
};

type Milestone = {
  milestone_index: number;
  description: string;
  amount: string;
};

type EscrowSummary = {
  escrow_id: number;
  milestones: Milestone[];
};

export default function DisputeDetail({ params }: { params: { escrowId: string } }) {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [dispute, setDispute] = useState<DisputeDetail | null | undefined>(undefined);
  const [escrow, setEscrow] = useState<EscrowSummary | null>(null);
  const [pending, setPending] = useState<"vote-renter" | "vote-host" | "resolve" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDispute() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes/${params.escrowId}`, {
      cache: "no-store",
    });
    setDispute(res.ok ? await res.json() : null);
  }

  async function loadEscrow() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows/${params.escrowId}`, {
      cache: "no-store",
    });
    setEscrow(res.ok ? await res.json() : null);
  }

  useEffect(() => {
    loadDispute();
    loadEscrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.escrowId]);

  const disputedMilestone = escrow?.milestones.find(
    (m) => m.milestone_index === dispute?.milestone_index
  );

  async function vote(voteForRenter: boolean) {
    if (!publicKey) return;
    setError(null);
    setPending(voteForRenter ? "vote-renter" : "vote-host");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes/build/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurorWallet: publicKey,
          escrowId: Number(params.escrowId),
          voteForRenter,
        }),
      });
      if (!res.ok) throw new Error(`failed to build transaction (${res.status})`);
      const { xdr } = await res.json();
      await signAndSubmit(xdr);
      await loadDispute();
      toast("Vote cast", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to cast vote";
      setError(message);
      toast(message, "error");
    } finally {
      setPending(null);
    }
  }

  async function resolve() {
    setError(null);
    setPending("resolve");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes/build/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowId: Number(params.escrowId) }),
      });
      if (!res.ok) throw new Error(`failed to build transaction (${res.status})`);
      const { xdr } = await res.json();
      await signAndSubmit(xdr);
      await loadDispute();
      toast("Dispute resolved", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to resolve dispute";
      setError(message);
      toast(message, "error");
    } finally {
      setPending(null);
    }
  }

  if (dispute === undefined) return <p>Loading…</p>;
  if (dispute === null) return <p>No dispute found for this escrow.</p>;

  return (
    <div>
      <h1>Dispute — escrow #{dispute.escrow_id}</h1>
      <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
        Milestone {dispute.milestone_index}
        {disputedMilestone && (
          <>
            (<strong>{disputedMilestone.description}</strong>, {disputedMilestone.amount})
          </>
        )}{" "}
        · opened by <code>{dispute.opened_by_wallet}</code>
        <CopyButton value={dispute.opened_by_wallet} />
      </p>
      <p>
        Status: <strong>{dispute.resolved ? dispute.outcome : "voting open"}</strong>
      </p>
      <p>
        <a href={`/escrow/${dispute.escrow_id}`}>View full escrow</a>
      </p>

      <h2>Evidence</h2>
      {dispute.evidence.length === 0 && <p>No evidence submitted.</p>}
      <ul>
        {dispute.evidence.map((ev) => (
          <li key={ev.id} style={{ marginBottom: 8 }}>
            <a href={ev.uri} target="_blank" rel="noreferrer">
              {ev.uri}
            </a>
            {ev.note && <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{ev.note}</div>}
            <div style={{ fontSize: 12, color: "var(--color-muted)" }}>from {ev.submitted_by}</div>
          </li>
        ))}
      </ul>

      {!dispute.resolved && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button onClick={() => vote(true)} disabled={!publicKey || pending !== null}>
            {pending === "vote-renter" ? "Voting…" : "Vote for renter"}
          </Button>
          <Button onClick={() => vote(false)} disabled={!publicKey || pending !== null}>
            {pending === "vote-host" ? "Voting…" : "Vote for host"}
          </Button>
          <Button variant="secondary" onClick={resolve} disabled={pending !== null}>
            {pending === "resolve" ? "Resolving…" : "Resolve (once votes are in)"}
          </Button>
        </div>
      )}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );
}
