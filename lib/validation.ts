const BASE32_56 = /^[A-Z2-7]{55}$/;

/**
 * Shape-only check (correct prefix, length, and base32 charset) — not a full
 * StrKey checksum verification. Good enough to catch typos before building a
 * transaction; the contract/RPC layer is the real source of truth.
 */
function isStrKeyShaped(value: string, prefix: string): boolean {
  return value.startsWith(prefix) && BASE32_56.test(value.slice(1));
}

export function isValidAccountAddress(value: string): boolean {
  return isStrKeyShaped(value, "G");
}

export function isValidContractAddress(value: string): boolean {
  return isStrKeyShaped(value, "C");
}
