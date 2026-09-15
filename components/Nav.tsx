"use client";

import { useState } from "react";
import { NavWallet } from "./NavWallet";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/disputes", label: "Disputes" },
  { href: "/escrow/new", label: "New escrow" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <strong>SafeTrust v2</strong>

        <button
          className="nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="nav-links"
          style={{
            background: "none",
            border: "1px solid var(--color-secondary-border)",
            borderRadius: 6,
            color: "var(--color-fg)",
            padding: "6px 10px",
            marginLeft: "auto",
          }}
        >
          Menu
        </button>

        <div id="nav-links" className={`nav-links${open ? " open" : ""}`}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <ThemeToggle />
            <NavWallet />
          </div>
        </div>
      </div>
    </nav>
  );
}
