import { describe, expect, it } from "vitest";
import { isValidAccountAddress, isValidContractAddress } from "./validation";

const VALID_ACCOUNT = "G" + "A".repeat(55);
const VALID_CONTRACT = "C" + "A".repeat(55);

describe("isValidAccountAddress", () => {
  it("accepts a G-prefixed 56-char base32 string", () => {
    expect(isValidAccountAddress(VALID_ACCOUNT)).toBe(true);
  });

  it("rejects a contract address", () => {
    expect(isValidAccountAddress(VALID_CONTRACT)).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidAccountAddress("G" + "A".repeat(54))).toBe(false);
    expect(isValidAccountAddress("G" + "A".repeat(56))).toBe(false);
  });

  it("rejects lowercase letters", () => {
    expect(isValidAccountAddress("G" + "a".repeat(55))).toBe(false);
  });

  it("rejects digits outside 2-7", () => {
    expect(isValidAccountAddress("G" + "1".repeat(55))).toBe(false);
    expect(isValidAccountAddress("G" + "9".repeat(55))).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidAccountAddress("")).toBe(false);
  });
});

describe("isValidContractAddress", () => {
  it("accepts a C-prefixed 56-char base32 string", () => {
    expect(isValidContractAddress(VALID_CONTRACT)).toBe(true);
  });

  it("rejects an account address", () => {
    expect(isValidContractAddress(VALID_ACCOUNT)).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidContractAddress("C" + "A".repeat(54))).toBe(false);
  });
});
