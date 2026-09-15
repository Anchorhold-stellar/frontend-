import type { ReactNode } from "react";
import "./globals.css";
import { WalletProvider } from "../lib/wallet-context";
import { ToastProvider } from "../lib/toast-context";
import { ThemeProvider } from "../lib/theme-context";
import { NavWallet } from "../components/NavWallet";
import { NetworkBanner } from "../components/NetworkBanner";
import { ThemeToggle } from "../components/ThemeToggle";

export const metadata = {
  title: "SafeTrust v2",
  description: "Self-custodied milestone escrow for rentals, on Soroban.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Runs before paint so a saved/system dark preference doesn't
          // flash light first; ThemeProvider takes over after hydration.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("safetrust:theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <ThemeProvider>
          <ToastProvider>
            <WalletProvider>
              <NetworkBanner />
              <nav
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <strong>SafeTrust v2</strong>
                <a href="/dashboard">Dashboard</a>
                <a href="/disputes">Disputes</a>
                <a href="/escrow/new">New escrow</a>
                <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                  <ThemeToggle />
                  <NavWallet />
                </div>
              </nav>
              <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>{children}</main>
            </WalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
