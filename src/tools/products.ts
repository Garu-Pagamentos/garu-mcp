import type { Garu, SetProductPortalConfigParams } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, fail } from "./shared.js";

const portalConfigShape = {
  businessName: z
    .string()
    .max(120)
    .nullable()
    .optional()
    .describe("Display name shown on the hosted payment page header."),
  logoUrl: z
    .string()
    .url()
    .max(500)
    .nullable()
    .optional()
    .describe("HTTPS URL of the logo image."),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .nullable()
    .optional()
    .describe("Primary brand color in hex (e.g. '#257264')."),
  allowCancelSubscription: z.boolean().nullable().optional(),
  allowUpdatePaymentMethod: z.boolean().nullable().optional(),
  allowUpdateBillingInfo: z.boolean().nullable().optional(),
  allowViewInvoices: z.boolean().nullable().optional(),
  allowApplyCoupons: z.boolean().nullable().optional(),
  requireCancelReason: z.boolean().nullable().optional(),
  cancelAtPeriodEndOnly: z.boolean().nullable().optional(),
  sendCancellationEmail: z.boolean().nullable().optional(),
  sendPaymentMethodUpdatedEmail: z.boolean().nullable().optional(),
  customSuccessMessage: z.string().max(500).nullable().optional(),
  customCancellationMessage: z.string().max(500).nullable().optional(),
  customWelcomeText: z.string().max(500).nullable().optional(),
};

export function registerProductTools(server: McpServer, garu: Garu): void {
  server.tool(
    "list_products",
    "List products for the authenticated seller with pagination and search. " +
      "The UUID returned for each product is the same identifier accepted by " +
      "create_pix_charge and create_boleto_charge.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 20"),
      search: z.string().max(255).optional().describe("Search by product name"),
      tab: z
        .string()
        .max(64)
        .optional()
        .describe(
          "Backend tab filter (e.g. 'active', 'archived'). Backend default applies if omitted.",
        ),
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

  server.tool(
    "get_product_portal_config",
    "Get the per-product portal customization (business name, logo, primary color, " +
      "cancellation policy, custom welcome / success / cancellation messages). " +
      "Returns null when no per-product config exists — the product falls back to " +
      "the seller-level portal config. Used by B2B2C platforms that model their " +
      "professionals/coaches as Products under a single seller.",
    {
      productId: z
        .number()
        .int()
        .positive()
        .describe(
          "Numeric product id (NOT the UUID — get it from list_products).",
        ),
    },
    async (args) => {
      try {
        const { productId } = args as unknown as { productId: number };
        const cfg = await garu.products.portalConfig.get(productId);
        return ok(cfg);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "set_product_portal_config",
    "Create or merge the per-product portal customization. Both this tool and " +
      "PATCH have the same merge semantics: only fields you provide are written; " +
      "unspecified fields keep their persisted value. Use clear_product_portal_config " +
      "(DELETE) to reset everything. Each Boolean / string field can be passed as null " +
      "to inherit from the seller-level config.",
    {
      productId: z
        .number()
        .int()
        .positive()
        .describe("Numeric product id (NOT the UUID)."),
      ...portalConfigShape,
    },
    async (args) => {
      try {
        const { productId, ...rest } = args as unknown as {
          productId: number;
        } & SetProductPortalConfigParams;
        const cfg = await garu.products.portalConfig.set(productId, rest);
        return ok(cfg);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "clear_product_portal_config",
    "Remove the per-product portal customization. The product falls back to the " +
      "seller-level portal config. Returns { removed: true } when a row was " +
      "deleted, { removed: false } when there was nothing to remove.",
    {
      productId: z
        .number()
        .int()
        .positive()
        .describe("Numeric product id (NOT the UUID)."),
    },
    async (args) => {
      try {
        const { productId } = args as unknown as { productId: number };
        const result = await garu.products.portalConfig.clear(productId);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
