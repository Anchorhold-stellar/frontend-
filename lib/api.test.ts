import { beforeEach, describe, expect, it, vi } from "vitest";

const freighterMock = {
  signBlob: vi.fn(),
};

vi.mock("@stellar/freighter-api", () => freighterMock);

import { apiPost, buildAuthHeaders } from "./api";

const WALLET = "G" + "A".repeat(55);

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("buildAuthHeaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches a challenge, signs the base64 nonce bytes, and returns wallet headers", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(200, { nonce: "abc123" }));
    freighterMock.signBlob.mockResolvedValue("c2ln");

    const headers = await buildAuthHeaders(WALLET);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/auth/challenge?wallet=${WALLET}`),
    );
    // "abc123" as UTF-8 bytes, base64-encoded — the exact bytes Freighter signs.
    const expectedBlob = btoa("abc123");
    expect(freighterMock.signBlob).toHaveBeenCalledWith(expectedBlob, {
      accountToSign: WALLET,
    });
    expect(headers).toEqual({ "X-Wallet-Address": WALLET, "X-Wallet-Signature": "c2ln" });
  });

  it("throws when the challenge request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(401, {}));
    await expect(buildAuthHeaders(WALLET)).rejects.toThrow("failed to get an auth challenge");
  });

  it("throws when the backend returns an empty nonce", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(200, { nonce: "" }));
    await expect(buildAuthHeaders(WALLET)).rejects.toThrow("empty auth challenge");
  });

  it("throws when Freighter returns no signature", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(200, { nonce: "n" }));
    freighterMock.signBlob.mockResolvedValue("");
    await expect(buildAuthHeaders(WALLET)).rejects.toThrow("did not return a signature");
  });
});

describe("apiPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sends the auth headers and parses the JSON body", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse(200, { nonce: "n" }))
      .mockResolvedValueOnce(jsonResponse(200, { xdr: "AAAA" }));
    freighterMock.signBlob.mockResolvedValue("c2ln");

    const result = await apiPost<{ xdr: string }>("/escrows/build/deposit", WALLET, {
      escrowId: 7,
    });

    expect(result).toEqual({ xdr: "AAAA" });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({
      "X-Wallet-Address": WALLET,
      "X-Wallet-Signature": "c2ln",
    });
  });

  it("surfaces the backend error message on failure", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse(200, { nonce: "n" }))
      .mockResolvedValueOnce(jsonResponse(400, { message: "escrow not in created status" }));
    freighterMock.signBlob.mockResolvedValue("c2ln");

    await expect(apiPost("/escrows/build/cancel", WALLET, {})).rejects.toThrow(
      "escrow not in created status",
    );
  });
});
