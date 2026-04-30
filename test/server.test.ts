import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

describe("server", () => {
  it("exposes 13 tools total (5 charge + 6 customer + 2 product)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(13);
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain("list_products");
    expect(names).toContain("get_product");
    expect(names).toContain("set_customer_billing_email_override");

    await client.close();
    await server.close();
  });

  it("exposes resources", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const resources = await client.listResources();
    const uris = resources.resources.map((r) => r.uri);
    expect(uris).toContain("garu://docs/quickstart");
    expect(uris).toContain("garu://docs/openapi");

    await client.close();
    await server.close();
  });

  it("quickstart resource returns markdown", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.readResource({ uri: "garu://docs/quickstart" });
    const text = result.contents[0];
    expect(text).toBeDefined();
    expect(text?.mimeType).toBe("text/markdown");

    await client.close();
    await server.close();
  });

  it("exposes prompts", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const prompts = await client.listPrompts();
    const names = prompts.prompts.map((p) => p.name);
    expect(names).toContain("create_pix_charge");
    expect(names).toContain("list_recent_charges");

    await client.close();
    await server.close();
  });
});
