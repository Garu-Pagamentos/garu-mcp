import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "../src/server.js";

export function setupServer() {
  const server = createServer({ apiKey: "sk_test_abc" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  return { server, client, clientTransport, serverTransport };
}

/**
 * Stubs `globalThis.fetch` to return a fast 401 "Invalid API key" response
 * instead of letting the SDK reach the real gateway. `setupServer()` always
 * uses the fake key `sk_test_abc`, so any test exercising the HTTP layer
 * without this stub depends on live network access to garu.com.br — that
 * works from a machine with real internet but times out in CI runners
 * without egress to it. Call `restore()` in a `finally` block.
 */
export function stubInvalidApiKey(): { restore: () => void } {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: "Invalid API key" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof globalThis.fetch;
  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
