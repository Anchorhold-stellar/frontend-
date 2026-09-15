import type { ReactNode } from "react";
import { WalletProvider } from "../lib/wallet-context";
import { ToastProvider } from "../lib/toast-context";
import { NavWallet } from "../components/NavWallet";
import { NetworkBanner } from "../components/NetworkBanner";

export const metadata = {
  title: "SafeTrust v2",
  description: "Self-custodied milestone escrow for rentals, on Soroban.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <ToastProvider>
          <WalletProvider>
            <NetworkBanner />
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "16px 24px",
                borderBottom: "1px solid #e5e5e5",
              }}
            >
              <strong>SafeTrust v2</strong>
              <a href="/dashboard">Dashboard</a>
              <a href="/disputes">Disputes</a>
              <a href="/escrow/new">New escrow</a>
              <div style={{ marginLeft: "auto" }}>
                <NavWallet />
              </div>
            </nav>
            <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>{children}</main>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
