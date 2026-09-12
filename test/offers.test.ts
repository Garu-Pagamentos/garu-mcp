import { describe, expect, it } from "vitest";

import { setupServer, stubInvalidApiKey } from "./helpers.js";

function errorText(result: { content: unknown }): string {
  return (result.content as Array<{ text: string }>)[0]!.text;
}

async function call(name: string, args: Record<string, unknown>) {
  const stub = stubInvalidApiKey();
  try {
    const { server, client, clientTransport, serverTransport } = setupServer();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const result = await client.callTool({ name, arguments: args });
    await client.close();
    await server.close();
    return result;
  } finally {
    stub.restore();
  }
}
/**
 * These assert the ZOD SCHEMA, not the HTTP call — sk_test_abc is never a valid
 * key. Input that passes validation reaches the transport and fails on auth
 * ("Error: Invalid API key"); input the schema rejects is refused by MCP itself
 * with code -32602 and never gets that far.
 *
 * Matched on the -32602 marker rather than on words like "invalid": the auth
 * failure ALSO says "Invalid API key", so a keyword heuristic reports every
 * valid input as rejected. It did exactly that, silently, until an SDK bump
 * changed the auth message and exposed it.
 */
const SCHEMA_REJECTION = /-32602|Input validation error/;
const reachedTransport = (text: string) => !SCHEMA_REJECTION.test(text);

describe("offer slug schema", () => {
  it("accepts a well-formed slug", async () => {
    const result = await call("create_offer", {
      productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
      name: "Black Friday",
      value: 97.0,
      slug: "black-friday",
    });

    expect(result.isError).toBe(true);
    expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
      true,
    );
  });

  it.each(["Black-Friday", "-promo", "promo-", "ab", "black friday"])(
    "rejects %p before it reaches the API",
    async (slug) => {
      const result = await call("create_offer", {
        productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
        name: "X",
        value: 97,
        slug,
      });

      expect(result.isError).toBe(true);
      expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
        false,
      );
    },
  );

  it("allows omitting the slug entirely, which is the unguessable option", async () => {
    const result = await call("create_offer", {
      productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
      name: "Lista fria",
      value: 97,
    });

    expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
      true,
    );
  });
});

describe("offer value schema", () => {
  it.each([0, -1])("rejects a non-positive price (%p)", async (value) => {
    const result = await call("create_offer", {
      productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
      name: "X",
      value,
    });

    expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
      false,
    );
  });

  it("accepts a price ABOVE the product default — an offer may be an upsell", async () => {
    const result = await call("create_offer", {
      productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
      name: "VIP",
      value: 9970.5,
    });

    expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
      true,
    );
  });
});

describe("list_offers filter", () => {
  it.each(["true", "false", "all"])("accepts active=%s", async (active) => {
    const result = await call("list_offers", {
      productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
      active,
    });

    expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
      true,
    );
  });

  it("rejects an unknown filter rather than silently listing everything", async () => {
    const result = await call("list_offers", {
      productUuid: "00d6d5d1-b094-4546-a49a-f9864e822c3c",
      active: "sim",
    });

    expect(reachedTransport(errorText(result as { content: unknown }))).toBe(
      false,
    );
  });
});
