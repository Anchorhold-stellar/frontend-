import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { WalletProvider } from "../lib/wallet-context";
import { ToastProvider } from "../lib/toast-context";
import { ThemeProvider } from "../lib/theme-context";
import { Nav } from "../components/Nav";
import { NetworkBanner } from "../components/NetworkBanner";

const TITLE = "SafeTrust v2";
const DESCRIPTION = "Self-custodied milestone escrow for rentals, on Soroban.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
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
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <WalletProvider>
              <NetworkBanner />
              <Nav />
              <main
                id="main-content"
                tabIndex={-1}
                style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}
              >
                {children}
              </main>
            </WalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
