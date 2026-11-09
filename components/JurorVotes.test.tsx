import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { JurorVotes } from "./JurorVotes";

const BALLOTS = [
  { juror_wallet: "GAAA1111111111111111111111111111111111111111111111AA", vote_for_renter: true },
  { juror_wallet: "GBBB2222222222222222222222222222222222222222222222BB", vote_for_renter: false },
];

describe("JurorVotes", () => {
  it("renders the tally from the backend response", () => {
    render(<JurorVotes votes={BALLOTS} tally={{ forRenter: 1, forHost: 1 }} />);
    expect(screen.getByText("1 for renter · 1 for host (2 votes)")).toBeInTheDocument();
  });

  it("renders one row per ballot with a truncated wallet and side", () => {
    render(<JurorVotes votes={BALLOTS} tally={{ forRenter: 1, forHost: 1 }} />);
    expect(screen.getByText(/voted for renter/)).toBeInTheDocument();
    expect(screen.getByText(/voted for host/)).toBeInTheDocument();
  });

  it("shows an empty state when no votes have been cast yet", () => {
    render(<JurorVotes votes={[]} tally={{ forRenter: 0, forHost: 0 }} />);
    expect(screen.getByText("0 for renter · 0 for host (0 votes)")).toBeInTheDocument();
    expect(screen.getByText("No juror votes yet.")).toBeInTheDocument();
  });
});
