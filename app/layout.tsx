import type { ReactNode } from "react";
import "./globals.css";
import { WalletProvider } from "../lib/wallet-context";
import { ToastProvider } from "../lib/toast-context";
import { ThemeProvider } from "../lib/theme-context";
import { Nav } from "../components/Nav";
import { NetworkBanner } from "../components/NetworkBanner";

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
              <Nav />
              <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>{children}</main>
            </WalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
