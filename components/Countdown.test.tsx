import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Countdown } from "./Countdown";

const NOW = new Date("2026-01-15T12:00:00.000Z");

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows days and hours for a far-future target", () => {
    const target = new Date(NOW.getTime() + 2 * 86400_000 + 3 * 3600_000).toISOString();
    render(<Countdown target={target} />);
    expect(screen.getByText("2d 3h")).toBeInTheDocument();
  });

  it("shows 'any moment now' once the target has passed", () => {
    const target = new Date(NOW.getTime() - 1000).toISOString();
    render(<Countdown target={target} />);
    expect(screen.getByText("any moment now")).toBeInTheDocument();
  });

  it("ticks down as time advances", () => {
    const target = new Date(NOW.getTime() + 90_000).toISOString();
    render(<Countdown target={target} />);
    expect(screen.getByText("1m 30s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(screen.getByText("59s")).toBeInTheDocument();
  });
});
