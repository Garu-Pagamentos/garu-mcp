import { describe, expect, it } from "vitest";

import { setupServer } from "./helpers.js";

function errorText(result: { content: unknown }): string {
  return (result.content as Array<{ text: string }>)[0]!.text;
}

describe("product portal-config productId schema", () => {
  it("accepts a UUID string", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    // Network call will fail (sk_test_abc isn't valid), but we only care that
    // the zod schema accepts the input and reaches the tool body.
    const result = await client.callTool({
      name: "get_product_portal_config",
      arguments: { productId: "00d6d5d1-b094-4546-a49a-f9864e822c3c" },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    // Past the schema — error came from HTTP layer (auth fails on sk_test_abc),
    // not from input validation. Schema rejections surface as MCP tool errors
    // that don't reach the HTTP client at all.
    expect(text).toBe("Error: Invalid API key");

    await client.close();
    await server.close();
  });

  it("accepts a positive integer", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "get_product_portal_config",
      arguments: { productId: 57 },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toBe("Error: Invalid API key");

    await client.close();
    await server.close();
  });

  it("accepts a numeric string (legacy compat)", async () => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "get_product_portal_config",
      arguments: { productId: "57" },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    expect(text).toBe("Error: Invalid API key");

    await client.close();
    await server.close();
  });

  it.each([
    ["path traversal", "../charges"],
    ["query injection", "57?admin=true"],
    ["fragment injection", "57#frag"],
    ["malformed string", "abc"],
    ["empty string", ""],
    ["negative number", -1],
    ["zero", 0],
    ["floating point", 1.5],
  ])("rejects invalid productId at the schema boundary: %s (%j)", async (_label, value) => {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "get_product_portal_config",
      arguments: { productId: value },
    });

    expect(result.isError).toBe(true);
    const text = errorText(result);
    // Should fail at zod validation, NOT reach the HTTP layer.
    // (If it reached HTTP we'd get "Error: Invalid API key" from the fake key.)
    expect(text).not.toBe("Error: Invalid API key");

    await client.close();
    await server.close();
  });
});
