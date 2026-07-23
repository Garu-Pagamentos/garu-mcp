import type { Garu, Customer } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { customerSchema, ok, fail } from "./shared.js";

export function registerChargeTools(server: McpServer, garu: Garu): void {
  server.tool(
    "create_pix_charge",
    "Create a PIX charge. Returns a QR code for the customer to pay.",
    {
      productId: z.string().uuid().describe("Product UUID"),
      customer: customerSchema,
      additionalInfo: z
        .string()
        .max(1000)
        .optional()
        .describe("Free-form metadata"),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          productId: string;
          customer: Customer;
          additionalInfo?: string;
        };
        const charge = await garu.charges.create({
          productId: params.productId,
          paymentMethod: "pix",
          customer: params.customer,
          additionalInfo: params.additionalInfo,
        });
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "create_boleto_charge",
    "Create a boleto bancario charge. Returns a bank slip line for payment.",
    {
      productId: z.string().uuid().describe("Product UUID"),
      customer: customerSchema,
      additionalInfo: z.string().max(1000).optional(),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          productId: string;
          customer: Customer;
          additionalInfo?: string;
        };
        const charge = await garu.charges.create({
          productId: params.productId,
          paymentMethod: "boleto",
          customer: params.customer,
          additionalInfo: params.additionalInfo,
        });
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "list_charges",
    "List charges for the authenticated seller with pagination and filters.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 20"),
      status: z
        .string()
        .max(50)
        .optional()
        .describe(
          "Filter by status: pending, authorized, paid, failed, refunded, etc.",
        ),
      paymentMethod: z
        .string()
        .max(50)
        .optional()
        .describe("Filter: pix, boleto, creditCard"),
      productId: z
        .string()
        .uuid()
        .optional()
        .describe("Filter by product UUID"),
      search: z
        .string()
        .max(255)
        .optional()
        .describe("Search by customer name, email, or document"),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          page?: number;
          limit?: number;
          status?: string;
          paymentMethod?: string;
          productId?: string;
          search?: string;
        };
        const result = await garu.charges.list(params as never);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_charge",
    "Get details of a specific charge by its uuid.",
    { uuid: z.string().describe("Charge uuid") },
    async (args) => {
      try {
        const { uuid } = args as unknown as { uuid: string };
        const charge = await garu.charges.retrieve(uuid);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "refund_charge",
    "Refund a charge fully or partially. Amount is in BRL / reais (e.g. 10.50 for R$10,50). " +
      "For a Pix Automatico charge the refund is asynchronous: the charge returns as refund_pending " +
      "and only reaches refunded once the transfer settles.",
    {
      uuid: z.string().describe("Charge uuid to refund"),
      amount: z
        .number()
        .positive()
        .optional()
        .describe(
          "Partial refund amount in BRL / reais (e.g. 10.50). Omit for full refund.",
        ),
      reason: z.string().max(500).optional().describe("Reason for the refund"),
    },
    async (args) => {
      try {
        const { uuid, amount, reason } = args as unknown as {
          uuid: string;
          amount?: number;
          reason?: string;
        };
        // Reais, passed straight through. The SDK/API take reais here; the old
        // *100 conversion refunded 100x the intended amount.
        const charge = await garu.charges.refund(uuid, { amount, reason });
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "cancel_charge",
    "Cancel an unpaid charge by its uuid.",
    { uuid: z.string().describe("Charge uuid to cancel") },
    async (args) => {
      try {
        const { uuid } = args as unknown as { uuid: string };
        const result = await garu.charges.cancel(uuid);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
