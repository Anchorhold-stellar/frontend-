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

import { checkNetwork, connectFreighter, FreighterNotInstalledError } from "./wallet";

const STORAGE_KEY = "safetrust:wallet";

type WalletState = {
  publicKey: string | null;
  connecting: boolean;
  error: string | null;
  notInstalled: boolean;
  network: string | null;
  networkMismatch: boolean;
};

type WalletContextValue = WalletState & {
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    connecting: false,
    error: null,
    notInstalled: false,
    network: null,
    networkMismatch: false,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setState((s) => ({ ...s, publicKey: stored }));
      checkNetwork()
        .then(({ network, mismatch }) =>
          setState((s) => ({ ...s, network, networkMismatch: mismatch }))
        )
        .catch(() => {
          // Freighter may not be installed/unlocked yet; the connect button
          // will surface that when the user tries to interact.
        });
    }
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null, notInstalled: false }));
    try {
      const publicKey = await connectFreighter();
      const { network, mismatch } = await checkNetwork();
      window.localStorage.setItem(STORAGE_KEY, publicKey);
      setState({
        publicKey,
        connecting: false,
        error: null,
        notInstalled: false,
        network,
        networkMismatch: mismatch,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        connecting: false,
        notInstalled: err instanceof FreighterNotInstalledError,
        error: err instanceof Error ? err.message : "failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({
      publicKey: null,
      connecting: false,
      error: null,
      notInstalled: false,
      network: null,
      networkMismatch: false,
    });
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
