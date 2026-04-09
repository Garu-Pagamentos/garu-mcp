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

describe("server", () => {
  it("exposes 11 tools total (6 charge + 5 customer)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(11);

    await client.close();
    await server.close();
  });

  it("exposes resources", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const resources = await client.listResources();
    const uris = resources.resources.map((r) => r.uri);
    expect(uris).toContain("garu://docs/quickstart");
    expect(uris).toContain("garu://docs/openapi");

    await client.close();
    await server.close();
  });

  it("quickstart resource returns markdown", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.readResource({ uri: "garu://docs/quickstart" });
    const text = result.contents[0];
    expect(text).toBeDefined();
    expect(text?.mimeType).toBe("text/markdown");

    await client.close();
    await server.close();
  });

  it("exposes prompts", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const prompts = await client.listPrompts();
    const names = prompts.prompts.map((p) => p.name);
    expect(names).toContain("create_pix_charge");
    expect(names).toContain("list_recent_charges");

    await client.close();
    await server.close();
  });
});
