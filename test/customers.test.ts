import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

function errorText(result: { content: unknown }): string {
  return ((result.content as Array<{ text: string }>)[0]).text;
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

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    const text = errorText(result);
    expect(text).toMatch(/^Error: /);

    await client.close();
    await server.close();
  });

  it("update_customer rejects invalid document format", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "update_customer",
      arguments: { id: 1, document: "invalid-doc" },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toMatch(/invalid|regex|document/i);

    await client.close();
    await server.close();
  });

  it("update_customer rejects invalid phone format", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "update_customer",
      arguments: { id: 1, phone: "123" },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toMatch(/invalid|regex|phone/i);

    await client.close();
    await server.close();
  });

  it("update_customer rejects invalid state format", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "update_customer",
      arguments: { id: 1, state: "invalid" },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toMatch(/invalid|regex|state/i);

    await client.close();
    await server.close();
  });

  it("update_customer rejects invalid zipCode format", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "update_customer",
      arguments: { id: 1, zipCode: "123" },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toMatch(/invalid|regex|zipCode/i);

    await client.close();
    await server.close();
  });

  it("update_customer rejects name exceeding max length", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "update_customer",
      arguments: { id: 1, name: "a".repeat(256) },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toMatch(/too_big|max|255|string/i);

    await client.close();
    await server.close();
  });
});
