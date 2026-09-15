import { beforeEach, describe, expect, it } from "vitest";
import { addRecentHost, getRecentHosts } from "./recent-addresses";

describe("recent-addresses", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing has been stored", () => {
    expect(getRecentHosts()).toEqual([]);
  });

  it("adds an address as the most recent entry", () => {
    addRecentHost("GADDR1");
    addRecentHost("GADDR2");
    expect(getRecentHosts()).toEqual(["GADDR2", "GADDR1"]);
  });

  it("moves a re-added address back to the front instead of duplicating it", () => {
    addRecentHost("GADDR1");
    addRecentHost("GADDR2");
    addRecentHost("GADDR1");
    expect(getRecentHosts()).toEqual(["GADDR1", "GADDR2"]);
  });

  it("caps the list at 5 entries, dropping the oldest", () => {
    for (let i = 1; i <= 6; i++) {
      addRecentHost(`GADDR${i}`);
    }
    expect(getRecentHosts()).toEqual(["GADDR6", "GADDR5", "GADDR4", "GADDR3", "GADDR2"]);
  });

  it("returns an empty list if the stored value isn't valid JSON", () => {
    window.localStorage.setItem("safetrust:recent-hosts", "not-json");
    expect(getRecentHosts()).toEqual([]);
  });
});
