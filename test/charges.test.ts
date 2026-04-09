import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

function errorText(result: { content: unknown }): string {
  return ((result.content as Array<{ text: string }>)[0]).text;
}

describe("charge tools", () => {
  it("lists available charge tools", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).toContain("create_pix_charge");
    expect(names).toContain("create_boleto_charge");
    expect(names).toContain("list_charges");
    expect(names).toContain("get_charge");
    expect(names).toContain("refund_charge");

    await client.close();
    await server.close();
  });

  it("does not expose create_card_charge (PCI safety)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).not.toContain("create_card_charge");

    await client.close();
    await server.close();
  });

  it("get_charge handles errors gracefully", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({ name: "get_charge", arguments: { id: 1 } });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    const text = errorText(result);
    expect(text).toMatch(/^Error: /);
    // Error sanitization: no raw URLs should leak
    expect(text).not.toMatch(/https?:\/\/(?!.*redacted)/);

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
