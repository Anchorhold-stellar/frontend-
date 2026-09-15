"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "safetrust:wallet";

type WalletState = {
  publicKey: string | null;
  connecting: boolean;
  error: string | null;
};

type WalletContextValue = WalletState & {
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

// Swapped in by the real Freighter wiring (see lib/wallet.ts). Kept as an
// injected function rather than importing freighter-api directly here so
// this file only owns state/persistence, not wallet-provider specifics.
let connectImpl: () => Promise<string> = async () => {
  throw new Error("wallet connector not configured");
};

export function setWalletConnector(impl: () => Promise<string>) {
  connectImpl = impl;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    connecting: false,
    error: null,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setState((s) => ({ ...s, publicKey: stored }));
    }
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const publicKey = await connectImpl();
      window.localStorage.setItem(STORAGE_KEY, publicKey);
      setState({ publicKey, connecting: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err instanceof Error ? err.message : "failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({ publicKey: null, connecting: false, error: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, connect, disconnect }),
    [state, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
