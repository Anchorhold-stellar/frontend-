const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetches a fresh challenge nonce for the wallet and signs it with Freighter.
 * The backend verifies `Keypair.verify(nonce utf8 bytes, base64 signature)`
 * and consumes the nonce, so every authenticated POST starts here.
 *
 * Freighter signs the exact bytes it is given — encode the nonce to base64
 * first (browser-safe via TextEncoder + btoa) and hand back the base64
 * signature for those exact bytes.
 */
export async function buildAuthHeaders(
  wallet: string,
): Promise<Record<string, string>> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const challengeRes = await fetch(
    `${API_URL}/auth/challenge?wallet=${encodeURIComponent(wallet)}`,
  );
  if (!challengeRes.ok) {
    throw new Error(`failed to get an auth challenge (${challengeRes.status})`);
  }
  const { nonce } = (await challengeRes.json()) as { nonce?: string };
  if (!nonce) {
    throw new Error("backend returned an empty auth challenge");
  }

  const bytes = new TextEncoder().encode(nonce);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const blob = btoa(binary);

  const freighter = await import("@stellar/freighter-api");
  const signature = await freighter.signBlob(blob, { accountToSign: wallet });
  if (!signature) {
    throw new Error("Freighter did not return a signature");
  }
  return { "X-Wallet-Address": wallet, "X-Wallet-Signature": signature };
}

/**
 * POSTs to an authenticated backend route (`/escrows/build/*`,
 * `/disputes/build/*`) with the wallet-challenge headers the
 * WalletAuthGuard requires. Reads stay on plain fetch — they are public.
 */
export async function apiPost<T>(path: string, wallet: string, body: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const headers = await buildAuthHeaders(wallet);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      detail = Array.isArray(data.message) ? data.message.join("; ") : (data.message ?? detail);
    } catch {
      // Fall through with the status-based message.
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}
