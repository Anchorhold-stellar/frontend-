"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useWallet } from "../../../lib/wallet-context";
import { useToast } from "../../../lib/toast-context";
import { signAndSubmit } from "../../../lib/wallet";
import { Button } from "../../../components/ui/Button";
import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { CopyButton } from "../../../components/ui/CopyButton";
import { isValidAccountAddress, isValidContractAddress } from "../../../lib/validation";

type MilestoneDraft = {
  description: string;
  amount: string;
  autoReleaseDays: string;
};

const emptyMilestone = (): MilestoneDraft => ({
  description: "",
  amount: "",
  autoReleaseDays: "",
});

const DRAFT_KEY = "safetrust:escrow-draft";

type Draft = {
  hostWallet: string;
  assetAddress: string;
  milestones: MilestoneDraft[];
};

export default function NewEscrow() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [hostWallet, setHostWallet] = useState("");
  const [assetAddress, setAssetAddress] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([emptyMilestone()]);
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(DRAFT_KEY);
    if (!stored) return;
    try {
      const draft: Draft = JSON.parse(stored);
      setHostWallet(draft.hostWallet);
      setAssetAddress(draft.assetAddress);
      if (draft.milestones.length > 0) setMilestones(draft.milestones);
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const draft: Draft = { hostWallet, assetAddress, milestones };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [hostWallet, assetAddress, milestones]);

  function clearDraft() {
    window.localStorage.removeItem(DRAFT_KEY);
    setHostWallet("");
    setAssetAddress("");
    setMilestones([emptyMilestone()]);
  }

  function updateMilestone(index: number, patch: Partial<MilestoneDraft>) {
    setMilestones((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addMilestone() {
    setMilestones((rows) => [...rows, emptyMilestone()]);
  }

  function removeMilestone(index: number) {
    setMilestones((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!publicKey) {
      setError("connect your wallet first");
      setStatus("error");
      return;
    }
    if (!isValidAccountAddress(hostWallet)) {
      setError("host wallet address doesn't look like a valid Stellar account (G...)");
      setStatus("error");
      return;
    }
    if (!isValidContractAddress(assetAddress)) {
      setError("asset address doesn't look like a valid contract address (C...)");
      setStatus("error");
      return;
    }
    if (milestones.some((m) => !m.description.trim() || Number(m.amount) <= 0)) {
      setError("every milestone needs a description and an amount greater than zero");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/escrows/build/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renterWallet: publicKey,
          hostWallet,
          assetAddress,
          milestones: milestones.map((m) => ({
            description: m.description,
            amount: Number(m.amount),
            auto_release_offset: Number(m.autoReleaseDays) * 86400,
            auto_release_at: 0,
            released: false,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error(`failed to build transaction (${res.status})`);
      }
      const { xdr } = await res.json();
      const result = await signAndSubmit(xdr);
      setHash(result.hash);
      setStatus("success");
      window.localStorage.removeItem(DRAFT_KEY);
      toast("Escrow created", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to create escrow";
      setError(message);
      setStatus("error");
      toast(message, "error");
    }
  }

  if (status === "success") {
    return (
      <div>
        <h1>Escrow submitted</h1>
        <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Transaction confirmed: <code>{hash}</code>
          {hash && <CopyButton value={hash} />}
        </p>
        <a href="/dashboard">Back to dashboard</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Create an escrow</h1>
      {!publicKey && <p style={{ color: "var(--color-danger)" }}>Connect your wallet to continue.</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Host wallet address
            <br />
            <input
              value={hostWallet}
              onChange={(e) => setHostWallet(e.target.value)}
              placeholder="G..."
              required
              style={{ width: "100%" }}
            />
          </label>
          {hostWallet.length > 0 && !isValidAccountAddress(hostWallet) && (
            <div style={{ fontSize: 12, color: "var(--color-danger)" }}>
              Doesn&apos;t look like a valid account address
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Asset address
            <br />
            <input
              value={assetAddress}
              onChange={(e) => setAssetAddress(e.target.value)}
              placeholder="C... (SAC token contract)"
              required
              style={{ width: "100%" }}
            />
          </label>
          {assetAddress.length > 0 && !isValidContractAddress(assetAddress) && (
            <div style={{ fontSize: 12, color: "var(--color-danger)" }}>
              Doesn&apos;t look like a valid contract address
            </div>
          )}
        </div>

        <h2>Milestones</h2>
        {milestones.map((m, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}
          >
            <input
              placeholder="Description"
              value={m.description}
              onChange={(e) => updateMilestone(i, { description: e.target.value })}
              required
              style={{ flex: 2 }}
            />
            <input
              placeholder="Amount"
              type="number"
              value={m.amount}
              onChange={(e) => updateMilestone(i, { amount: e.target.value })}
              required
              style={{ flex: 1 }}
            />
            <input
              placeholder="Auto-release (days)"
              type="number"
              value={m.autoReleaseDays}
              onChange={(e) => updateMilestone(i, { autoReleaseDays: e.target.value })}
              required
              style={{ flex: 1 }}
            />
            {milestones.length > 1 && (
              <ConfirmButton
                type="button"
                variant="danger"
                confirmLabel="Confirm remove"
                onConfirm={() => removeMilestone(i)}
              >
                Remove
              </ConfirmButton>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={addMilestone}
          style={{ marginBottom: 16 }}
        >
          Add milestone
        </Button>

        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit" disabled={!publicKey || status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Create escrow"}
          </Button>
          <ConfirmButton type="button" confirmLabel="Confirm discard" onConfirm={clearDraft}>
            Discard draft
          </ConfirmButton>
        </div>
        {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      </form>
    </div>
  );
}
