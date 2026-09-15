import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const freighterMock = {
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getNetworkDetails: vi.fn(),
  signTransaction: vi.fn(),
};

vi.mock("@stellar/freighter-api", () => freighterMock);

import {
  checkNetwork,
  checkRpcHealth,
  connectFreighter,
  FreighterNotInstalledError,
  signAndSubmit,
} from "./wallet";

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

describe("checkRpcHealth", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns true when the RPC reports healthy", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ result: { status: "healthy" } })
    );
    expect(await checkRpcHealth()).toBe(true);
  });

  it("returns false when the RPC reports something other than healthy", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ result: { status: "degraded" } })
    );
    expect(await checkRpcHealth()).toBe(false);
  });

  it("returns false when the RPC returns a JSON-RPC error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: { message: "boom" } })
    );
    expect(await checkRpcHealth()).toBe(false);
  });

  it("returns false when the fetch itself throws", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    expect(await checkRpcHealth()).toBe(false);
  });
});

describe("connectFreighter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws FreighterNotInstalledError when Freighter isn't connected", async () => {
    freighterMock.isConnected.mockResolvedValue(false);
    await expect(connectFreighter()).rejects.toBeInstanceOf(FreighterNotInstalledError);
  });

  it("returns the public key from requestAccess when installed", async () => {
    freighterMock.isConnected.mockResolvedValue(true);
    freighterMock.requestAccess.mockResolvedValue("GADDRESS");
    expect(await connectFreighter()).toBe("GADDRESS");
  });
});

describe("checkNetwork", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports no mismatch when the passphrase matches", async () => {
    freighterMock.getNetworkDetails.mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    expect(await checkNetwork()).toEqual({ network: "TESTNET", mismatch: false });
  });

  it("reports a mismatch when the passphrase differs", async () => {
    freighterMock.getNetworkDetails.mockResolvedValue({
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
    });
    expect(await checkNetwork()).toEqual({ network: "PUBLIC", mismatch: true });
  });
});

describe("signAndSubmit", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    freighterMock.signTransaction.mockResolvedValue("SIGNED_XDR");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("resolves with the hash once the transaction confirms", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ result: { status: "PENDING", hash: "abc123" } }))
      .mockResolvedValueOnce(jsonResponse({ result: { status: "SUCCESS" } }));

    await expect(signAndSubmit("UNSIGNED_XDR")).resolves.toEqual({ hash: "abc123" });
  });

  it("rejects when the RPC rejects the submission outright", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ result: { status: "ERROR", hash: "abc123" } })
    );

    await expect(signAndSubmit("UNSIGNED_XDR")).rejects.toThrow(/rejected/);
  });

  it("rejects when the submitted transaction later fails", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse({ result: { status: "PENDING", hash: "abc123" } }))
      .mockResolvedValueOnce(jsonResponse({ result: { status: "FAILED" } }));

    await expect(signAndSubmit("UNSIGNED_XDR")).rejects.toThrow(/failed/);
  });

  it("gives up after the timeout if the transaction never confirms", async () => {
    vi.useFakeTimers();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ result: { status: "NOT_FOUND" } })
    );
    // First call is sendTransaction; make it PENDING so we enter the poll loop.
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ result: { status: "PENDING", hash: "abc123" } })
    );

    const pending = signAndSubmit("UNSIGNED_XDR");
    const assertion = expect(pending).rejects.toThrow(/timed out/);

    for (let i = 0; i < 12; i++) {
      await vi.advanceTimersByTimeAsync(1500);
    }

    await assertion;
  });
});
