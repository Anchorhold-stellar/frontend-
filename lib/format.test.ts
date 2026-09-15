import { describe, expect, it, vi, afterEach } from "vitest";
import { formatAmount, formatRelativeTime } from "./format";

describe("formatAmount", () => {
  it("adds thousands separators to a numeric string", () => {
    expect(formatAmount("1234567")).toBe("1,234,567");
  });

  it("accepts a plain number", () => {
    expect(formatAmount(1000)).toBe("1,000");
  });

  it("passes through non-numeric input unchanged", () => {
    expect(formatAmount("not-a-number")).toBe("not-a-number");
  });

  it("handles zero", () => {
    expect(formatAmount("0")).toBe("0");
  });
});

describe("formatRelativeTime", () => {
  const NOW = new Date("2026-01-15T12:00:00.000Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for timestamps within the last minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const thirtySecondsAgo = new Date(NOW.getTime() - 30_000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe("just now");
  });

  it("formats a past timestamp in hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3 hours ago");
  });

  it("formats a future timestamp in days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const twoDaysAhead = new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAhead)).toBe("in 2 days");
  });
});
