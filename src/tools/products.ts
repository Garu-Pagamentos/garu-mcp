import type { Garu } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, fail } from "./shared.js";

export function registerProductTools(server: McpServer, garu: Garu): void {
  server.tool(
    "list_products",
    "List products for the authenticated seller with pagination and search. " +
      "The UUID returned for each product is the same identifier accepted by " +
      "create_pix_charge and create_boleto_charge.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z.number().min(1).max(100).optional().describe("Items per page, default 20"),
      search: z.string().max(255).optional().describe("Search by product name"),
      tab: z
        .string()
        .max(64)
        .optional()
        .describe("Backend tab filter (e.g. 'active', 'archived'). Backend default applies if omitted."),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          page?: number;
          limit?: number;
          search?: string;
          tab?: string;
        };
        const result = await garu.products.list(params);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_product",
    "Get details of a specific product by UUID. " +
      "Use this to inspect a product before creating a charge.",
    { uuid: z.string().uuid().describe("Product UUID") },
    async (args) => {
      try {
        const { uuid } = args as unknown as { uuid: string };
        const product = await garu.products.get(uuid);
        return ok(product);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
