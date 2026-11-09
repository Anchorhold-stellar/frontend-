"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../../lib/wallet-context";
import { useToast } from "../../../lib/toast-context";
import { signAndSubmit } from "../../../lib/wallet";
import { apiPost } from "../../../lib/api";
import { Button } from "../../../components/ui/Button";
import { CopyButton } from "../../../components/ui/CopyButton";
import { JurorVotes, type VotesResponse } from "../../../components/JurorVotes";
import { useDocumentTitle } from "../../../lib/use-document-title";
import { formatAmount, formatRelativeTime } from "../../../lib/format";

type Evidence = {
  id: string;
  submitted_by: string;
  uri: string;
  note: string | null;
  created_at: string;
};

type DisputeRow = {
  escrow_id: number;
  milestone_index: number;
  opened_by_wallet: string;
  opened_at: string;
  resolved: boolean;
  outcome: string;
};

type DisputeDetail = DisputeRow & {
  evidence: Evidence[];
};

type DisputeWithVotes = {
  dispute: DisputeDetail;
  votes: VotesResponse;
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

/**
 * Every dispute on one escrow, each scoped to its milestone. The backend
 * keys disputes (and their votes) by (escrow_id, milestone_index) — an
 * escrow can collect several independent disputes over its lifetime — so
 * this page enumerates them via the public disputes list, then loads each
 * one's evidence plus its juror-vote tally from
 * GET /disputes/:escrowId/:milestoneIndex/votes. Vote and resolve builds
 * carry the milestone index the contract requires.
 */
export default function DisputeDetail({ params }: { params: { escrowId: string } }) {
  useDocumentTitle(`Dispute #${params.escrowId}`);
  const escrowId = Number(params.escrowId);
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [escrow, setEscrow] = useState<EscrowSummary | null>(null);
  const [items, setItems] = useState<DisputeWithVotes[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAll() {
    try {
      const [listRes, escrowRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes?limit=100`, { cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows/${params.escrowId}`, {
          cache: "no-store",
        }),
      ]);
      if (!listRes.ok) {
        setLoadError(`failed to load disputes (${listRes.status})`);
        return;
      }
      const all = (await listRes.json()) as DisputeRow[];
      const mine = all.filter((d) => d.escrow_id === escrowId);
      const withVotes = await Promise.all(
        mine.map(async (row) => {
          const [detailRes, votesRes] = await Promise.all([
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/disputes/${row.escrow_id}/${row.milestone_index}`,
              { cache: "no-store" },
            ),
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/disputes/${row.escrow_id}/${row.milestone_index}/votes`,
              { cache: "no-store" },
            ),
          ]);
          if (!detailRes.ok) throw new Error(`failed to load dispute (${detailRes.status})`);
          if (!votesRes.ok) throw new Error(`failed to load votes (${votesRes.status})`);
          return {
            dispute: (await detailRes.json()) as DisputeDetail,
            votes: (await votesRes.json()) as VotesResponse,
          };
        }),
      );
      setItems(withVotes);
      setEscrow(escrowRes.ok ? ((await escrowRes.json()) as EscrowSummary) : null);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "failed to load dispute");
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.escrowId]);

  async function vote(dispute: DisputeDetail, voteForRenter: boolean) {
    if (!publicKey) return;
    setError(null);
    const key = `vote-${dispute.milestone_index}-${voteForRenter ? "renter" : "host"}`;
    setPending(key);
    try {
      const { xdr } = await apiPost<{ xdr: string }>(
        "/disputes/build/vote",
        publicKey,
        {
          jurorWallet: publicKey,
          escrowId,
          milestoneIndex: dispute.milestone_index,
          voteForRenter,
        },
      );
      await signAndSubmit(xdr);
      await loadAll();
      toast("Vote cast", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to cast vote";
      setError(message);
      toast(message, "error");
    } finally {
      setPending(null);
    }
  }

  async function resolve(dispute: DisputeDetail) {
    if (!publicKey) return;
    setError(null);
    const key = `resolve-${dispute.milestone_index}`;
    setPending(key);
    try {
      const { xdr } = await apiPost<{ xdr: string }>(
        "/disputes/build/resolve",
        publicKey,
        {
          callerWallet: publicKey,
          escrowId,
          milestoneIndex: dispute.milestone_index,
        },
      );
      await signAndSubmit(xdr);
      await loadAll();
      toast("Dispute resolved", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to resolve dispute";
      setError(message);
      toast(message, "error");
    } finally {
      setPending(null);
    }
  }

  if (loadError) {
    return (
      <p style={{ color: "var(--color-danger)", display: "flex", gap: 8, alignItems: "center" }}>
        {loadError}
        <Button variant="secondary" onClick={loadAll}>
          Retry
        </Button>
      </p>
    );
  }
  if (items === null) return <p>Loading…</p>;
  if (items.length === 0) return <p>No dispute found for this escrow.</p>;

  return (
    <div>
      <a href="/disputes" style={{ fontSize: 13 }}>
        ← Back to disputes
      </a>
      <h1>Disputes — escrow #{params.escrowId}</h1>
      {items.map(({ dispute, votes }) => {
        const disputedMilestone = escrow?.milestones.find(
          (m) => m.milestone_index === dispute.milestone_index,
        );
        return (
          <section key={dispute.milestone_index} style={{ marginBottom: 32 }}>
            <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
              Milestone {dispute.milestone_index}
              {disputedMilestone && (
                <>
                  (<strong>{disputedMilestone.description}</strong>,{" "}
                  {formatAmount(disputedMilestone.amount)})
                </>
              )}{" "}
              · opened {formatRelativeTime(dispute.opened_at)} by{" "}
              <code>{dispute.opened_by_wallet}</code>
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
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                    from {ev.submitted_by} · {formatRelativeTime(ev.created_at)}
                  </div>
                </li>
              ))}
            </ul>

            <h2>Juror votes</h2>
            <JurorVotes votes={votes.votes} tally={votes.tally} />

            {!dispute.resolved && (
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button
                  onClick={() => vote(dispute, true)}
                  disabled={!publicKey || pending !== null}
                >
                  {pending === `vote-${dispute.milestone_index}-renter`
                    ? "Voting…"
                    : "Vote for renter"}
                </Button>
                <Button
                  onClick={() => vote(dispute, false)}
                  disabled={!publicKey || pending !== null}
                >
                  {pending === `vote-${dispute.milestone_index}-host` ? "Voting…" : "Vote for host"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => resolve(dispute)}
                  disabled={pending !== null}
                >
                  {pending === `resolve-${dispute.milestone_index}`
                    ? "Resolving…"
                    : "Resolve (once votes are in)"}
                </Button>
              </div>
            )}
          </section>
        );
      })}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );
}
