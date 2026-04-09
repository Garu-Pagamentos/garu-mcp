import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "../src/server.js";

function setupServer() {
  const server = createServer({ apiKey: "sk_test_abc" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  return { server, client, clientTransport, serverTransport };
}

describe("customer tools", () => {
  it("lists available customer tools", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).toContain("create_customer");
    expect(names).toContain("list_customers");
    expect(names).toContain("get_customer");
    expect(names).toContain("update_customer");
    expect(names).toContain("delete_customer");

    await client.close();
    await server.close();
  });

  it("get_customer handles errors gracefully", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({ name: "get_customer", arguments: { id: 1 } });

    expect(result.content).toBeDefined();
    expect(result.content).toHaveLength(1);

    await client.close();
    await server.close();
  });
});
