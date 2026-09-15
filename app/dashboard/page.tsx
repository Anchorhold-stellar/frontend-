"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "../../lib/wallet-context";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { useDocumentTitle } from "../../lib/use-document-title";
import { formatAmount } from "../../lib/format";

type EscrowSummary = {
  escrow_id: number;
  status: string;
  total_amount: string;
  renter_wallet: string;
  host_wallet: string;
};

type RoleFilter = "all" | "hosting" | "renting";

const STATUS_FILTERS = ["all", "created", "active", "disputed", "completed", "cancelled"] as const;

const SORT_OPTIONS = {
  "id-desc": { label: "Newest ID first", compare: (a: EscrowSummary, b: EscrowSummary) => b.escrow_id - a.escrow_id },
  "id-asc": { label: "Oldest ID first", compare: (a: EscrowSummary, b: EscrowSummary) => a.escrow_id - b.escrow_id },
  "amount-desc": {
    label: "Amount: high to low",
    compare: (a: EscrowSummary, b: EscrowSummary) => Number(b.total_amount) - Number(a.total_amount),
  },
  "amount-asc": {
    label: "Amount: low to high",
    compare: (a: EscrowSummary, b: EscrowSummary) => Number(a.total_amount) - Number(b.total_amount),
  },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

const PAGE_SIZE = 10;

function isRoleFilter(value: string | null): value is RoleFilter {
  return value === "all" || value === "hosting" || value === "renting";
}

function isStatusFilter(value: string | null): value is (typeof STATUS_FILTERS)[number] {
  return (STATUS_FILTERS as readonly string[]).includes(value ?? "");
}

function isSortKey(value: string | null): value is SortKey {
  return Object.keys(SORT_OPTIONS).includes(value ?? "");
}

export default function Dashboard() {
  return (
    <Suspense fallback={<Spinner label="Loading dashboard…" />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  useDocumentTitle("Dashboard");
  const { publicKey } = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [escrows, setEscrows] = useState<EscrowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(() => {
    const value = searchParams.get("role");
    return isRoleFilter(value) ? value : "all";
  });
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>(() => {
    const value = searchParams.get("status");
    return isStatusFilter(value) ? value : "all";
  });
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const value = searchParams.get("sort");
    return isSortKey(value) ? value : "id-desc";
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("q", search);
    if (sortKey !== "id-desc") params.set("sort", sortKey);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter, search, sortKey]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [roleFilter, statusFilter, search, sortKey]);

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
    return escrows
      .filter((e) => {
        const roleMatch =
          roleFilter === "all" ||
          (roleFilter === "hosting" && e.host_wallet === publicKey) ||
          (roleFilter === "renting" && e.renter_wallet === publicKey);
        const statusMatch = statusFilter === "all" || e.status === statusFilter;
        const searchMatch = query === "" || String(e.escrow_id).includes(query);
        return roleMatch && statusMatch && searchMatch;
      })
      .sort(SORT_OPTIONS[sortKey].compare);
  }, [escrows, roleFilter, statusFilter, search, sortKey, publicKey]);

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

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by escrow ID…"
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{ padding: 8 }}
        >
          {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

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
      {filtered && filtered.length > 0 && (
        <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 12 }}>
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} escrow
          {filtered.length === 1 ? "" : "s"} · total value{" "}
          {formatAmount(filtered.reduce((sum, e) => sum + Number(e.total_amount), 0))}
        </div>
      )}
      {filtered?.length === 0 && (
        <EmptyState>No escrows match these filters{search && " and search"}.</EmptyState>
      )}
      {filtered?.slice(0, visibleCount).map((e) => (
        <Card key={e.escrow_id}>
          <a href={`/escrow/${e.escrow_id}`} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Escrow #{e.escrow_id} — {formatAmount(e.total_amount)}
              {e.host_wallet === publicKey ? " (hosting)" : " (renting)"}
            </span>
            <StatusBadge status={e.status} />
          </a>
        </Card>
      ))}
      {filtered && filtered.length > visibleCount && (
        <Button variant="secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
          Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
        </Button>
      )}
    </div>
  );
}
