"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "../../lib/wallet-context";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { useDocumentTitle } from "../../lib/use-document-title";

type EscrowSummary = {
  escrow_id: number;
  status: string;
  total_amount: string;
  renter_wallet: string;
  host_wallet: string;
};

type RoleFilter = "all" | "hosting" | "renting";

const STATUS_FILTERS = ["all", "created", "active", "disputed", "completed", "cancelled"] as const;

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { publicKey } = useWallet();
  const [escrows, setEscrows] = useState<EscrowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    if (!escrows) return escrows;
    const query = search.trim();
    return escrows.filter((e) => {
      const roleMatch =
        roleFilter === "all" ||
        (roleFilter === "hosting" && e.host_wallet === publicKey) ||
        (roleFilter === "renting" && e.renter_wallet === publicKey);
      const statusMatch = statusFilter === "all" || e.status === statusFilter;
      const searchMatch = query === "" || String(e.escrow_id).includes(query);
      return roleMatch && statusMatch && searchMatch;
    });
  }, [escrows, roleFilter, statusFilter, search, publicKey]);

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

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by escrow ID…"
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        {(["all", "hosting", "renting"] as const).map((role) => (
          <Button
            key={role}
            variant={roleFilter === role ? "primary" : "secondary"}
            onClick={() => setRoleFilter(role)}
          >
            {role === "all" ? "All roles" : role}
          </Button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "primary" : "secondary"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All statuses" : status}
          </Button>
        ))}
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {!error && filtered === null && <Spinner label="Loading escrows…" />}
      {filtered?.length === 0 && (
        <EmptyState>No escrows match these filters{search && " and search"}.</EmptyState>
      )}
      {filtered?.map((e) => (
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
