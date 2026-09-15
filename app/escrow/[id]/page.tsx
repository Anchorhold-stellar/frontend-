"use client";

import { useEffect, useState } from "react";
import { MilestoneTimeline } from "../../../components/MilestoneTimeline";
import { useWallet } from "../../../lib/wallet-context";
import { useToast } from "../../../lib/toast-context";
import { signAndSubmit } from "../../../lib/wallet";
import { StatusBadge } from "../../../components/ui/Badge";
import { Spinner } from "../../../components/ui/Spinner";
import { Button } from "../../../components/ui/Button";
import { CopyButton } from "../../../components/ui/CopyButton";
import { ProgressBar } from "../../../components/ui/ProgressBar";

type Milestone = {
  milestone_index: number;
  description: string;
  amount: string;
  released: boolean;
  auto_release_at: string | null;
};

type Escrow = {
  escrow_id: number;
  status: string;
  total_amount: string;
  renter_wallet: string;
  host_wallet: string;
  milestones: Milestone[];
};

export default function EscrowDetail({ params }: { params: { id: string } }) {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [escrow, setEscrow] = useState<Escrow | null | undefined>(undefined);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadEscrow() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows/${params.id}`, {
      cache: "no-store",
    });
    setEscrow(res.ok ? await res.json() : null);
  }

  useEffect(() => {
    loadEscrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleConfirm(milestoneIndex: number) {
    if (!publicKey || !escrow) return;
    setActionError(null);
    setConfirmingIndex(milestoneIndex);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows/build/confirm-milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renterWallet: publicKey,
          escrowId: escrow.escrow_id,
          milestoneIndex,
        }),
      });
      if (!res.ok) throw new Error(`failed to build transaction (${res.status})`);
      const { xdr } = await res.json();
      await signAndSubmit(xdr);
      await loadEscrow();
      toast("Milestone released", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to confirm milestone";
      setActionError(message);
      toast(message, "error");
    } finally {
      setConfirmingIndex(null);
    }
  }

  async function handleDeposit() {
    if (!publicKey || !escrow) return;
    setActionError(null);
    setDepositing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows/build/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renterWallet: publicKey,
          escrowId: escrow.escrow_id,
        }),
      });
      if (!res.ok) throw new Error(`failed to build transaction (${res.status})`);
      const { xdr } = await res.json();
      await signAndSubmit(xdr);
      await loadEscrow();
      toast("Deposit confirmed", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to deposit";
      setActionError(message);
      toast(message, "error");
    } finally {
      setDepositing(false);
    }
  }

  if (escrow === undefined) {
    return <Spinner label="Loading escrow…" />;
  }
  if (escrow === null) {
    return <p>Escrow not found.</p>;
  }

  const isRenter = publicKey === escrow.renter_wallet;
  const isHost = publicKey === escrow.host_wallet;

  const releasedCount = escrow.milestones.filter((m) => m.released).length;
  const releasedAmount = escrow.milestones
    .filter((m) => m.released)
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const totalAmount = Number(escrow.total_amount) || 1;

  return (
    <div>
      <h1>Escrow #{escrow.escrow_id}</h1>
      <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <StatusBadge status={escrow.status} /> · Total: {escrow.total_amount}
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 4 }}>
          {releasedCount} of {escrow.milestones.length} milestones released ·{" "}
          {Math.round((releasedAmount / totalAmount) * 100)}% of funds released
        </div>
        <ProgressBar fraction={releasedAmount / totalAmount} />
      </div>

      <div style={{ fontSize: 14, color: "var(--color-fg)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Renter: <code>{escrow.renter_wallet}</code>
          <CopyButton value={escrow.renter_wallet} />
          {isRenter && <em>(you)</em>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Host: <code>{escrow.host_wallet}</code>
          <CopyButton value={escrow.host_wallet} />
          {isHost && <em>(you)</em>}
        </div>
      </div>

      {isRenter && escrow.status === "created" && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
            This escrow hasn&apos;t been funded yet. Deposit to start the milestone clock.
          </p>
          <Button onClick={handleDeposit} disabled={depositing}>
            {depositing ? "Depositing…" : `Deposit ${escrow.total_amount}`}
          </Button>
        </div>
      )}

      <MilestoneTimeline
        milestones={escrow.milestones}
        onConfirm={isRenter ? handleConfirm : undefined}
        confirmingIndex={confirmingIndex}
      />
      {actionError && <p style={{ color: "var(--color-danger)" }}>{actionError}</p>}

      {escrow.status === "disputed" ? (
        <a href={`/disputes/${escrow.escrow_id}`}>View dispute</a>
      ) : (
        <a href={`/disputes/new?escrowId=${escrow.escrow_id}`}>
          Something wrong with this stay? Open a dispute.
        </a>
      )}
    </div>
  );
}
