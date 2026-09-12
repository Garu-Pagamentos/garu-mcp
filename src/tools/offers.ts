import type { CreateOfferParams, Garu, UpdateOfferParams } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, fail } from "./shared.js";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const slugField = z
  .string()
  .regex(SLUG_PATTERN)
  .nullable()
  .optional()
  .describe(
    "Optional link identifier used as ?offer=<slug>. Lowercase letters, digits " +
      "and hyphens, 3-40 chars, unique per product. IT IS PUBLIC AND GUESSABLE — " +
      "anyone holding the product link can try ?offer=promo. Omit it for pricing " +
      "that should not circulate; the link then carries the unguessable offer id.",
  );

const valueField = z
  .number()
  .positive()
  .describe(
    "Price in REAIS (decimal BRL), e.g. 97.50 — NOT centavos. Same unit as the " +
      "product's own value. May be higher than the product price: an offer works " +
      "as a premium link as well as a discount.",
  );

export function registerOfferTools(server: McpServer, garu: Garu): void {
  server.tool(
    "list_offers",
    "List a product's offers. An offer is a named price on a product, reachable " +
      "at /pay/{productUuid}?offer={slug or id}. It overrides the PRICE and nothing " +
      "else — payment methods, installments, carnê, name, description and image all " +
      "stay on the product, and a bare product link keeps charging the product's own " +
      "price. Returns active offers by default.",
    {
      productUuid: z.string().uuid().describe("Product UUID"),
      active: z
        .enum(["true", "false", "all"])
        .optional()
        .describe(
          "'true' (default) active only, 'false' deactivated, 'all' both",
        ),
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 20"),
    },
    async (args) => {
      try {
        const { productUuid, ...params } = args as unknown as {
          productUuid: string;
          active?: "true" | "false" | "all";
          page?: number;
          limit?: number;
        };
        return ok(await garu.offers.list(productUuid, params));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_offer",
    "Get one offer by id. Use it to read the current price and whether it is still active.",
    {
      offerId: z
        .string()
        .max(50)
        .describe("Offer id, e.g. offer_1Hv7j4EGexuTiOU5BlLNGGuL"),
    },
    async (args) => {
      try {
        const { offerId } = args as unknown as { offerId: string };
        return ok(await garu.offers.get(offerId));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "create_offer",
    "Create an offer so the same product can be sold at a second price behind its " +
      "own link. Nothing already published changes: a bare product link keeps " +
      "charging the product's price. Answers 409 if the product has fixed-share " +
      "co-producers the price could not cover, and 400 on a subscription product " +
      "(those select their price with priceId instead).",
    {
      productUuid: z
        .string()
        .uuid()
        .describe("Product UUID the offer belongs to"),
      name: z
        .string()
        .min(1)
        .max(255)
        .describe(
          "Seller-facing label, e.g. 'Black Friday'. NEVER shown to the buyer.",
        ),
      value: valueField,
      slug: slugField,
      isActive: z.boolean().optional().describe("Starts active. Default true."),
    },
    async (args) => {
      try {
        const { productUuid, ...params } = args as unknown as {
          productUuid: string;
        } & CreateOfferParams;
        return ok(await garu.offers.create(productUuid, params));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "update_offer",
    "Update an offer — reprice, rename, or activate/deactivate it. Deactivating is " +
      "the right way to END a promo: the link then falls back to the product's price " +
      "and tells the buyer the offer ended, so the sale still completes. Repricing " +
      "applies to future sales only; past transactions keep the amount they collected.",
    {
      offerId: z.string().max(50).describe("Offer id"),
      name: z.string().min(1).max(255).optional(),
      value: valueField.optional(),
      slug: slugField,
      isActive: z
        .boolean()
        .optional()
        .describe("Set false to stop selling through this link. Reversible."),
    },
    async (args) => {
      try {
        const { offerId, ...params } = args as unknown as {
          offerId: string;
        } & UpdateOfferParams;
        return ok(await garu.offers.update(offerId, params));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "delete_offer",
    "Delete an offer permanently. Works ONLY while it has never sold — once a " +
      "transaction points at it the answer is 409, so past sales keep their " +
      "attribution. To stop selling an offer that already has sales, call " +
      "update_offer with isActive false instead.",
    { offerId: z.string().max(50).describe("Offer id") },
    async (args) => {
      try {
        const { offerId } = args as unknown as { offerId: string };
        await garu.offers.del(offerId);
        return ok({ deleted: true, offerId });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
