import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

describe("server", () => {
  it("exposes 36 tools total (5 charge + 6 customer + 7 product + 13 scheduled-charge + 4 webhook-event + 1 integration)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(36);
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain("list_products");
    expect(names).toContain("get_product");
    expect(names).toContain("create_product");
    expect(names).toContain("update_product");
    expect(names).toContain("set_customer_billing_email_override");
    expect(names).toContain("create_scheduled_charge");
    expect(names).toContain("retry_webhook_event");
    expect(names).toContain("resend_webhook_event");
    expect(names).toContain("get_integration_setup");

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
    expect(uris).toContain("garu://docs/integration-setup");

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
    expect(names).toContain("setup_integration");

    await client.close();
    await server.close();
  });
});
