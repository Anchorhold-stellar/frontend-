import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("reflects the given fraction as a percentage", () => {
    render(<ProgressBar fraction={0.42} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  it("clamps fractions above 1 to 100%", () => {
    render(<ProgressBar fraction={1.5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps negative fractions to 0%", () => {
    render(<ProgressBar fraction={-0.3} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("treats NaN as 0%", () => {
    render(<ProgressBar fraction={NaN} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
