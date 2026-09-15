# AnchorHold — Frontend

Next.js 14 (App Router) frontend for AnchorHold, a self-custodied,
milestone-capable rental escrow platform on Stellar/Soroban. Renters and
hosts create escrows, fund and release them milestone by milestone, and
fall back to a juror-voted on-chain dispute process if something goes
wrong — all signed client-side with [Freighter](https://www.freighter.app/),
never through a custodial backend.

This repo is just the frontend. It expects a backend API and a deployed
Soroban escrow contract to talk to (see [API contract](#api-contract) below).

## Getting started

Requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — the test suite's jsdom
dependency needs webidl APIs that older Node 20.x builds don't have.

```
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3001
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (escrow/dispute CRUD + unsigned-XDR building) |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Soroban RPC endpoint used to submit signed transactions and poll for confirmation |
| `NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE` | Network passphrase Freighter must be connected to; a mismatch is surfaced as a warning banner |
| `NEXT_PUBLIC_ESCROW_CONTRACT_ID` | Deployed escrow contract ID |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3001 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest suite once |

## Project structure

```
app/
  page.tsx                    Landing page
  dashboard/                  Escrow list (filters, search, sort — synced to the URL)
  escrow/new/                 Escrow creation flow (drafts persist to localStorage)
  escrow/[id]/                Escrow detail: deposit, confirm milestones, live status
  disputes/                   Disputes you've opened or are a party to
  disputes/new/                Dispute filing (evidence + raise_dispute)
  disputes/[escrowId]/        Dispute detail: evidence, juror voting, resolve
components/
  ui/                          Design-system primitives (Button, Card, Badge, ...)
  Nav.tsx, WalletConnect.tsx, etc.   App-level components
lib/
  wallet.ts, wallet-context.tsx      Freighter connect/sign/submit + RPC polling
  toast-context.tsx, theme-context.tsx
  format.ts, validation.ts, recent-addresses.ts
```

Colocated `*.test.ts(x)` files hold the Vitest suite.

## API contract

The frontend expects these endpoints from `NEXT_PUBLIC_API_URL`:

- `GET /escrows?wallet=` — escrows where the wallet is renter or host
- `GET /escrows/:id` — one escrow with its milestones
- `POST /escrows/build/create` / `build/deposit` / `build/confirm-milestone` — return `{ xdr }` for the frontend to sign
- `GET /disputes?wallet=` — disputes opened by or affecting the wallet
- `GET /disputes/:escrowId` — one dispute with its evidence
- `POST /disputes/:escrowId/evidence` — record an evidence pointer
- `POST /disputes/build/raise` / `build/vote` / `build/resolve` — return `{ xdr }`

Every `build/*` endpoint hands back an unsigned transaction XDR; the
frontend signs it with Freighter and submits it directly to
`NEXT_PUBLIC_SOROBAN_RPC_URL` via `lib/wallet.ts#signAndSubmit`. The
backend never sees a private key.

## Testing

```
npm test
```

Vitest + Testing Library, jsdom environment. See `vitest.config.ts`.
