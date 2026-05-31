import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

function errorText(result: { content: unknown }): string {
  return ((result.content as Array<{ text: string }>)[0]).text;
}

describe("scheduled-charge tools", () => {
  it("registers all seven scheduled-charge tools", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).toContain("create_scheduled_charge");
    expect(names).toContain("list_scheduled_charges");
    expect(names).toContain("get_scheduled_charge");
    expect(names).toContain("postpone_scheduled_charge");
    expect(names).toContain("pause_scheduled_charge");
    expect(names).toContain("resume_scheduled_charge");
    expect(names).toContain("mark_paid_scheduled_charge");
    expect(names).toContain("charge_now_scheduled_charge");

    await client.close();
    await server.close();
  });

  it("create_scheduled_charge accepts type=recurring (passes schema, then surfaces SDK error)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "create_scheduled_charge",
      arguments: {
        customerId: 1,
        amount: 100,
        type: "recurring",
        dueDate: "2026-06-15",
        methods: ["pix"],
        recurrence: { interval: "monthly", intervalCount: 1 },
      },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toMatch(/^Error: /);

    await client.close();
    await server.close();
  });

  it("create_scheduled_charge rejects malformed dueDate", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "create_scheduled_charge",
      arguments: {
        customerId: 1,
        amount: 100,
        type: "one_time",
        dueDate: "2026/06/15",
        methods: ["pix"],
      },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toMatch(/regex|date|invalid/i);

    await client.close();
    await server.close();
  });

  it("create_scheduled_charge accepts the card method (passes schema, then surfaces SDK error)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "create_scheduled_charge",
      arguments: {
        customerId: 1,
        productId: 456,
        amount: 100,
        type: "recurring",
        dueDate: "2026-06-15",
        methods: ["card"],
        recurrence: { interval: "monthly", intervalCount: 1 },
      },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toMatch(/^Error: /);

    await client.close();
    await server.close();
  });

  it("create_scheduled_charge accepts pix_automatic (schema passes; SDK then errors with no backend)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "create_scheduled_charge",
      arguments: {
        customerId: 1,
        productId: 456,
        amount: 297.5,
        type: "recurring",
        dueDate: "2026-06-15",
        methods: ["pix_automatic"],
        recurrence: { interval: "monthly", intervalCount: 1 },
      },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toMatch(/^Error: /);

    await client.close();
    await server.close();
  });

  it("create_scheduled_charge rejects an unknown payment method at the schema layer", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "create_scheduled_charge",
      arguments: {
        customerId: 1,
        amount: 100,
        type: "one_time",
        dueDate: "2026-06-15",
        methods: ["pix_manual"],
      },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).not.toMatch(/^Error: /);

    await client.close();
    await server.close();
  });

  it("create_scheduled_charge rejects out-of-range maxRecoveryDays", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "create_scheduled_charge",
      arguments: {
        customerId: 1,
        amount: 100,
        type: "one_time",
        dueDate: "2026-06-15",
        methods: ["pix"],
        maxRecoveryDays: 400,
      },
    });

    expect(result.isError).toBe(true);

    await client.close();
    await server.close();
  });

  it("charge_now_scheduled_charge surfaces network errors gracefully", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "charge_now_scheduled_charge",
      arguments: { id: "sch_does_not_exist" },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toMatch(/^Error: /);

    await client.close();
    await server.close();
  });

  it("postpone_scheduled_charge rejects past dueDate via regex shape", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "postpone_scheduled_charge",
      arguments: { id: "sch_abc", newDueDate: "not-a-date" },
    });

    expect(result.isError).toBe(true);

    await client.close();
    await server.close();
  });

  it("get_scheduled_charge surfaces network errors gracefully", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "get_scheduled_charge",
      arguments: { id: "sch_does_not_exist" },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toMatch(/^Error: /);

    await client.close();
    await server.close();
  });
});
