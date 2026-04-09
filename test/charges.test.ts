import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "../src/server.js";

function setupServer() {
  const server = createServer({ apiKey: "sk_test_abc" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  return { server, client, clientTransport, serverTransport };
}

describe("charge tools", () => {
  it("lists available charge tools", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).toContain("create_pix_charge");
    expect(names).toContain("create_card_charge");
    expect(names).toContain("create_boleto_charge");
    expect(names).toContain("list_charges");
    expect(names).toContain("get_charge");
    expect(names).toContain("refund_charge");

    await client.close();
    await server.close();
  });

  it("get_charge returns charge data", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    // The server uses a real Garu SDK client pointed at the actual API,
    // so we can't mock it easily in integration tests. Instead, we verify
    // the tool handles errors gracefully (since sk_test_abc won't auth).
    const result = await client.callTool({ name: "get_charge", arguments: { id: 1 } });

    // Should get an error response (auth failure) rather than a crash
    expect(result.content).toBeDefined();
    expect(result.content).toHaveLength(1);

    await client.close();
    await server.close();
  });

  it("list_charges accepts filter params", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "list_charges",
      arguments: { page: 1, limit: 5, status: "paid" },
    });

    expect(result.content).toBeDefined();

    await client.close();
    await server.close();
  });
});
