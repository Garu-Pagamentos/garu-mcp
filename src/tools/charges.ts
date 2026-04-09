import type { Garu, CreateChargeParams, Customer } from "@garuhq/node";
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
      additionalInfo: z.string().max(1000).optional().describe("Free-form metadata"),
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
      limit: z.number().min(1).max(100).optional().describe("Items per page, default 20"),
      status: z.string().max(50).optional().describe("Filter by status: pending, paid, refunded, etc."),
      paymentMethod: z.string().max(50).optional().describe("Filter: pix, creditcard, boleto"),
      search: z.string().max(255).optional().describe("Search by customer name, email, or document"),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          page?: number;
          limit?: number;
          status?: string;
          paymentMethod?: string;
          search?: string;
        };
        const result = await garu.charges.list(params);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_charge",
    "Get details of a specific charge by its numeric ID.",
    { id: z.number().describe("Charge ID") },
    async (args) => {
      try {
        const { id } = args as unknown as { id: number };
        const charge = await garu.charges.get(id);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "refund_charge",
    "Refund a charge fully or partially. Amount is in BRL (e.g. 10.50 for R$10,50). Converted to centavos internally.",
    {
      id: z.number().describe("Charge ID to refund"),
      amount: z
        .number()
        .positive()
        .optional()
        .describe("Partial refund amount in BRL (e.g. 10.50). Omit for full refund."),
      reason: z.string().max(500).optional().describe("Reason for the refund"),
    },
    async (args) => {
      try {
        const { id, amount, reason } = args as unknown as {
          id: number;
          amount?: number;
          reason?: string;
        };
        // SDK expects centavos, tool accepts BRL for user-friendliness
        const amountCentavos = amount !== undefined ? Math.round(amount * 100) : undefined;
        const charge = await garu.charges.refund(id, { amount: amountCentavos, reason });
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
