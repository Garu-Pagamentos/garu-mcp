import type {
  CreateProductParams,
  Garu,
  SetProductPortalConfigParams,
  UpdateProductParams,
} from "@garuhq/node";
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
      "create_pix_charge and create_boleto_charge. Each product also carries a " +
      "pixAutomatic boolean — when true, Pix Automático (BACEN auto-debit " +
      "recurring Pix) is offered on the public subscription checkout.",
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
      "Use this to inspect a product before creating a charge. The pixAutomatic " +
      "boolean indicates whether Pix Automático (BACEN auto-debit recurring Pix) " +
      "is enabled on the public subscription checkout for this product.",
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

  const productIdSchema = z
    .union([
      z.string().uuid(),
      z.string().regex(/^\d+$/, "Must be a UUID or a positive integer string"),
      z.number().int().positive(),
    ])
    .describe(
      "Product identifier — accepts the UUID (preferred — same id returned by " +
        "list_products and webhook payloads) or the legacy positive integer id. " +
        "UUID support added in Garu v0.10.0.",
    );

  server.tool(
    "get_product_portal_config",
    "Get the per-product portal customization (business name, logo, primary color, " +
      "cancellation policy, custom welcome / success / cancellation messages). " +
      "Returns null when no per-product config exists — the product falls back to " +
      "the seller-level portal config. Used by B2B2C platforms that model their " +
      "professionals/coaches as Products under a single seller.",
    {
      productId: productIdSchema,
    },
    async (args) => {
      try {
        const { productId } = args as unknown as { productId: string | number };
        const cfg = await garu.products.portalConfig.get(productId);
        return ok(cfg);
      } catch (err) {
        return fail(err);
      }
    },
  );

  const productWriteShape = {
    name: z.string().max(255).optional().describe("Product name."),
    value: z
      .number()
      .nonnegative()
      .optional()
      .describe(
        "Price in decimal BRL / reais (e.g. R$29,90 → 29.90) — NOT centavos. " +
          "Products store the price in reais, the same as the API and dashboard.",
      ),
    description: z
      .string()
      .max(2000)
      .optional()
      .describe("Product description."),
    image: z
      .string()
      .url()
      .max(500)
      .optional()
      .describe("HTTPS URL of the product cover image."),
    tags: z.array(z.string().max(64)).optional().describe("Free-form tags."),
    pix: z.boolean().optional().describe("Offer PIX at checkout."),
    boleto: z.boolean().optional().describe("Offer Boleto at checkout."),
    creditCard: z
      .boolean()
      .optional()
      .describe("Offer credit card at checkout."),
    pixAutomatic: z
      .boolean()
      .optional()
      .describe(
        "When true, exposes Pix Automático (BACEN auto-debit recurring Pix) on " +
          "the subscription checkout. Only the subscription checkout mode reads it.",
      ),
    installments: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max number of installments offered on credit card."),
    isSubscription: z
      .boolean()
      .optional()
      .describe("Mark the product as a subscription (recurring)."),
    subscriptionType: z
      .string()
      .max(64)
      .optional()
      .describe("Subscription cadence label (e.g. 'monthly')."),
    unitLabel: z
      .string()
      .max(64)
      .optional()
      .describe("Per-unit label shown on the checkout (e.g. 'seat')."),
    returnUrl: z
      .string()
      .url()
      .max(500)
      .optional()
      .describe("URL the buyer returns to after a successful payment."),
    returnUrlButtonText: z
      .string()
      .max(120)
      .optional()
      .describe("Label for the return-URL button on the success page."),
    statementDescriptor: z
      .string()
      .max(120)
      .optional()
      .describe("Text shown on the buyer's card/bank statement."),
  };

  server.tool(
    "create_product",
    "Create a product for the authenticated seller. Returns the created product, " +
      "whose UUID is the same identifier accepted by create_pix_charge / " +
      "create_boleto_charge. value is in decimal BRL / reais (e.g. 29.90), NOT " +
      "centavos. Setting pixAutomatic: true exposes Pix " +
      "Automático (BACEN auto-debit recurring Pix) on the subscription checkout. " +
      "Pass idempotencyKey to make a retry across process restarts safe — the " +
      "backend returns the original product instead of creating a duplicate.",
    {
      ...productWriteShape,
      name: z.string().max(255).describe("Product name (required)."),
      idempotencyKey: z
        .string()
        .max(255)
        .optional()
        .describe(
          "Idempotency key for safe retries. Defaults to a generated UUIDv4.",
        ),
    },
    async (args) => {
      try {
        const params = args as CreateProductParams;
        const product = await garu.products.create(params);
        return ok(product);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "update_product",
    "Update an existing product (partial PATCH — only the fields you provide are " +
      "written; everything else keeps its persisted value). value is in decimal " +
      "BRL / reais (e.g. 29.90), NOT centavos. Setting pixAutomatic: true exposes Pix Automático (BACEN " +
      "auto-debit recurring Pix) on the subscription checkout. At least one write " +
      "field is required.",
    {
      productId: productIdSchema,
      ...productWriteShape,
    },
    async (args) => {
      try {
        const { productId, ...rest } = args as {
          productId: string | number;
        } & UpdateProductParams;
        const writeFields = Object.entries(rest).filter(
          ([, value]) => value !== undefined,
        );
        if (writeFields.length === 0) {
          return fail(
            new Error(
              "update_product requires one or more write fields " +
                "(e.g. name, value, pix, pixAutomatic).",
            ),
          );
        }
        const product = await garu.products.update(
          productId,
          Object.fromEntries(writeFields) as UpdateProductParams,
        );
        return ok(product);
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
      productId: productIdSchema,
      ...portalConfigShape,
    },
    async (args) => {
      try {
        const { productId, ...rest } = args as unknown as {
          productId: string | number;
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
      productId: productIdSchema,
    },
    async (args) => {
      try {
        const { productId } = args as unknown as { productId: string | number };
        const result = await garu.products.portalConfig.clear(productId);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
