import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    env: {
      NEXT_PUBLIC_SOROBAN_RPC_URL: "https://example.com/rpc",
      NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
    },
  },
});
