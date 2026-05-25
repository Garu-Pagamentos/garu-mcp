import { describe, expect, it, vi } from "vitest";

import { setupServer } from "./helpers.js";

function textContent(result: { content: unknown }): string {
  return ((result.content as Array<{ text: string }>)[0]).text;
}

describe("webhook-event tools", () => {
  it("registers list_webhook_events, get_webhook_event, retry_webhook_event, resend_webhook_event", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).toContain("list_webhook_events");
    expect(names).toContain("get_webhook_event");
    expect(names).toContain("retry_webhook_event");
    expect(names).toContain("resend_webhook_event");

    await client.close();
    await server.close();
  });

  it("list_webhook_events rejects an unknown status value", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.callTool({
      name: "list_webhook_events",
      arguments: { status: "delivered" },
    });

    expect(result.isError).toBe(true);
    expect(textContent(result)).toMatch(/enum|invalid/i);

    await client.close();
    await server.close();
  });

  it("get_webhook_event rejects a non-positive id", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.callTool({
      name: "get_webhook_event",
      arguments: { id: 0 },
    });

    expect(result.isError).toBe(true);

    await client.close();
    await server.close();
  });

  it("retry_webhook_event rejects a non-positive id", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.callTool({
      name: "retry_webhook_event",
      arguments: { id: -1 },
    });

    expect(result.isError).toBe(true);

    await client.close();
    await server.close();
  });

  it("list_webhook_events forwards filters end-to-end (snake → camel SDK → snake wire) and returns the SDK result", async () => {
    // Pins the full mapping chain: agent passes `event_type` / `endpoint_id`
    // (snake_case MCP convention) → handler must hand the SDK `eventType` /
    // `endpointId` (camelCase) → SDK puts them back to snake_case on the wire.
    // A regression at any link breaks customer queries silently (empty list
    // instead of an error), so this test pins all three forms in one shot.
    const fetchStub = vi.fn(async (_input: string | URL | Request) => {
      return new Response(
        JSON.stringify({
          events: [
            {
              id: 42,
              status: "failed",
              eventType: "transaction.payment.paid",
              webhookEndpoint: { id: 17, url: "https://example.test/hook" },
            },
          ],
          meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchStub as unknown as typeof globalThis.fetch;
    try {
      const { server, client, clientTransport, serverTransport } = setupServer();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      const result = await client.callTool({
        name: "list_webhook_events",
        arguments: {
          status: "failed",
          event_type: "transaction.payment.paid",
          endpoint_id: 17,
          limit: 50,
        },
      });

      expect(result.isError).toBeFalsy();
      expect(fetchStub).toHaveBeenCalledTimes(1);
      const firstCallArg = fetchStub.mock.calls[0]![0];
      const url =
        firstCallArg instanceof Request
          ? firstCallArg.url
          : String(firstCallArg);
      expect(url).toContain("/api/webhook-events");
      expect(url).toContain("status=failed");
      // Wire format is snake_case — proves the camelCase SDK input round-trips correctly.
      expect(url).toContain("event_type=transaction.payment.paid");
      expect(url).toContain("endpoint_id=17");
      expect(url).toContain("limit=50");

      const body = textContent(result);
      expect(body).toContain('"id": 42');
      expect(body).toContain('"status": "failed"');

      await client.close();
      await server.close();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("retry_webhook_event description points agents at resend_webhook_event for the common path", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.listTools();
    const retry = tools.tools.find((t) => t.name === "retry_webhook_event");
    expect(retry).toBeDefined();
    // retry_webhook_event is soft-deprecated in favor of resend_webhook_event;
    // pin the redirection so the soft-deprecation doesn't silently drop out
    // of the description.
    expect(retry!.description).toMatch(/resend_webhook_event/);

    await client.close();
    await server.close();
  });

  it("resend_webhook_event description names the audit-trail-preserving behavior and idempotency key", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const tools = await client.listTools();
    const resend = tools.tools.find((t) => t.name === "resend_webhook_event");
    expect(resend).toBeDefined();
    // Agents pick between retry and resend based on these phrases — pin them.
    expect(resend!.description).toMatch(/missed|unprocessed/i);
    expect(resend!.description).toMatch(/clone|preserv/i);
    expect(resend!.description).toMatch(/Idempotency-Key: resend_/);

    await client.close();
    await server.close();
  });

  it("resend_webhook_event rejects a non-positive id", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.callTool({
      name: "resend_webhook_event",
      arguments: { id: 0 },
    });

    expect(result.isError).toBe(true);

    await client.close();
    await server.close();
  });

  it("resend_webhook_event POSTs to /resend and returns the cloned event", async () => {
    // Pins the wire route: a regression that points this at /retry would
    // silently mutate the original event instead of cloning, losing the
    // audit trail this tool exists to protect.
    const fetchStub = vi.fn(async (_input: string | URL | Request) => {
      return new Response(
        JSON.stringify({
          id: 100,
          status: "pending",
          manualResendOf: 42,
          eventType: "transaction.payment.paid",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchStub as unknown as typeof globalThis.fetch;
    try {
      const { server, client, clientTransport, serverTransport } = setupServer();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      const result = await client.callTool({
        name: "resend_webhook_event",
        arguments: { id: 42 },
      });

      expect(result.isError).toBeFalsy();
      expect(fetchStub).toHaveBeenCalledTimes(1);
      const firstCallArg = fetchStub.mock.calls[0]![0];
      const url =
        firstCallArg instanceof Request
          ? firstCallArg.url
          : String(firstCallArg);
      expect(url).toContain("/api/webhook-events/42/resend");

      const body = textContent(result);
      expect(body).toContain('"id": 100');
      expect(body).toContain('"manualResendOf": 42');

      await client.close();
      await server.close();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
