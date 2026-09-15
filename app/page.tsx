"use client";

import { WalletConnect } from "../components/WalletConnect";
import { useWallet } from "../lib/wallet-context";
import { Card } from "../components/ui/Card";

const STEPS = [
  {
    title: "1. Create & fund",
    body: "Renter and host agree on milestones off-chain, then the renter creates the escrow and deposits funds into the contract.",
  },
  {
    title: "2. Confirm as you go",
    body: "Each milestone releases when the renter confirms it, or automatically once its auto-release window passes.",
  },
  {
    title: "3. Dispute if needed",
    body: "Either party can open a dispute with evidence; a juror pool votes and the outcome resolves on-chain.",
  },
];

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div>
      <h1>Rental escrow that doesn&apos;t need a third party to hold the keys</h1>
      <p>
        Deposits are locked in a contract you can read yourself, released in
        milestones as a stay progresses, and backed by an on-chain dispute
        process if something goes wrong.
      </p>

      {publicKey ? (
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <a href="/escrow/new">Create an escrow</a>
          <a href="/dashboard">View dashboard</a>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <WalletConnect />
        </div>
      )}

      <h2>How it works</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {STEPS.map((step) => (
          <Card key={step.title}>
            <strong>{step.title}</strong>
            <p style={{ fontSize: 14, color: "var(--color-muted)", marginBottom: 0 }}>{step.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
