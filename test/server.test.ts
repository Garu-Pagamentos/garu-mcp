import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

describe("server", () => {
  it("exposes 49 tools total (6 charge + 6 customer + 7 product + 13 scheduled-charge + 4 webhook-event + 1 integration + 8 installment-plan + 4 refund-request)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(49);
    const names = tools.tools.map((t) => t.name);
    // Carnê and refund requests. Named explicitly, not just counted: a tool
    // that silently stops registering keeps the total right if another is
    // added in the same release, and an agent then cannot reach it at all.
    for (const name of [
      "create_installment_plan",
      "list_installment_plans",
      "get_installment_plan",
      "reissue_plan_installment",
      "postpone_plan_installment",
      "mark_plan_installment_paid",
      "cancel_installment_plan",
      "request_plan_refund",
      "list_refund_requests",
      "get_refund_request",
      "confirm_refund_request",
      "reject_refund_request",
    ]) {
      expect(names).toContain(name);
    }
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
