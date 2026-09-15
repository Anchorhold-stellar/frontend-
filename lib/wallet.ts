const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL;

async function rpcCall<T>(method: string, params: Record<string, unknown>): Promise<T> {
  if (!RPC_URL) {
    throw new Error("NEXT_PUBLIC_SOROBAN_RPC_URL is not configured");
  }
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) {
    throw new Error(body.error.message ?? `${method} failed`);
  }
  return body.result as T;
}

export async function connectFreighter(): Promise<string> {
  const freighter = await import("@stellar/freighter-api");
  const connected = await freighter.isConnected();
  if (!connected) {
    throw new Error("Freighter is not installed");
  }
  return freighter.requestAccess();
}

/**
 * Returns the network Freighter is currently pointed at, and whether it
 * matches the passphrase this app is configured for. Signing a transaction
 * built for the wrong network fails cryptically at broadcast time, so it's
 * worth surfacing the mismatch up front.
 */
export async function checkNetwork(): Promise<{ network: string; mismatch: boolean }> {
  const freighter = await import("@stellar/freighter-api");
  const details = await freighter.getNetworkDetails();
  const expected = process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE;
  return {
    network: details.network,
    mismatch: Boolean(expected) && details.networkPassphrase !== expected,
  };
}

type SendTransactionResult = {
  status: "PENDING" | "DUPLICATE" | "TRY_AGAIN_LATER" | "ERROR";
  hash: string;
};

type GetTransactionResult = {
  status: "NOT_FOUND" | "SUCCESS" | "FAILED";
};

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 12;

async function waitForConfirmation(hash: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await rpcCall<GetTransactionResult>("getTransaction", { hash });
    if (result.status === "SUCCESS") return;
    if (result.status === "FAILED") {
      throw new Error(`transaction ${hash} failed`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`timed out waiting for transaction ${hash} to confirm`);
}

/**
 * Given an unsigned XDR string from the backend, sign it with Freighter and
 * submit it to Soroban RPC. Every "build/*" backend endpoint returns exactly
 * this shape, so this is the one function the rest of the frontend needs.
 */
export async function signAndSubmit(xdr: string): Promise<{ hash: string }> {
  const freighter = await import("@stellar/freighter-api");
  const signedXdr = await freighter.signTransaction(xdr, {
    networkPassphrase: process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  });

  const submitted = await rpcCall<SendTransactionResult>("sendTransaction", {
    transaction: signedXdr,
  });
  if (submitted.status === "ERROR") {
    throw new Error(`transaction rejected: ${submitted.hash}`);
  }

  await waitForConfirmation(submitted.hash);
  return { hash: submitted.hash };
}
