"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "../../../lib/wallet-context";
import { useToast } from "../../../lib/toast-context";
import { signAndSubmit } from "../../../lib/wallet";
import { Button } from "../../../components/ui/Button";

export default function NewDispute() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <NewDisputeForm />
    </Suspense>
  );
}

function NewDisputeForm() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const escrowId = searchParams.get("escrowId");

  const [milestoneIndex, setMilestoneIndex] = useState("0");
  const [evidenceUri, setEvidenceUri] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !escrowId) {
      setError(!escrowId ? "missing escrowId" : "connect your wallet first");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const evidenceRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/disputes/${escrowId}/evidence`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submittedBy: publicKey, uri: evidenceUri, note }),
        }
      );
      if (!evidenceRes.ok) {
        throw new Error(`failed to record evidence (${evidenceRes.status})`);
      }

      const buildRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes/build/raise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerWallet: publicKey,
          escrowId: Number(escrowId),
          milestoneIndex: Number(milestoneIndex),
          evidenceUri,
        }),
      });
      if (!buildRes.ok) {
        throw new Error(`failed to build transaction (${buildRes.status})`);
      }
      const { xdr } = await buildRes.json();
      const result = await signAndSubmit(xdr);
      setHash(result.hash);
      setStatus("success");
      toast("Dispute opened", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to open dispute";
      setError(message);
      setStatus("error");
      toast(message, "error");
    }
  }

  if (!escrowId) {
    return (
      <div>
        <h1>Open a dispute</h1>
        <p style={{ color: "#b00020" }}>
          No escrow selected. Open this page from an escrow&apos;s detail view.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div>
        <h1>Dispute opened</h1>
        <p>
          Transaction confirmed: <code>{hash}</code>
        </p>
        <a href={`/escrow/${escrowId}`}>Back to escrow</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Open a dispute for escrow #{escrowId}</h1>
      {!publicKey && <p style={{ color: "#b00020" }}>Connect your wallet to continue.</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Milestone index
            <br />
            <input
              type="number"
              min={0}
              value={milestoneIndex}
              onChange={(e) => setMilestoneIndex(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Evidence URI (IPFS/Arweave link)
            <br />
            <input
              value={evidenceUri}
              onChange={(e) => setEvidenceUri(e.target.value)}
              placeholder="ipfs://..."
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Note for jurors
            <br />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <Button type="submit" disabled={!publicKey || status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Open dispute"}
        </Button>
        {error && <p style={{ color: "#b00020" }}>{error}</p>}
      </form>
    </div>
  );
}
