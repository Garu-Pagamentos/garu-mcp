import type { Garu, CreateChargeParams, Customer, CardInfo } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().describe("Customer full name"),
  email: z.string().email().describe("Customer email"),
  document: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/)
    .describe("CPF (11 digits) or CNPJ (14 digits)"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/)
    .describe("Phone with area code, 10-11 digits"),
  zipCode: z.string().regex(/^\d{8}$/).optional().describe("ZIP code, 8 digits"),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("2-letter state code, e.g. SP"),
});

const cardInfoSchema = z.object({
  cardNumber: z.string().describe("13-19 digits, no spaces"),
  cvv: z.string().describe("3-4 digits"),
  expirationDate: z.string().describe("YYYY-MM"),
  holderName: z.string().describe("As printed on card"),
  installments: z.number().min(1).max(12),
});

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
      },
    ],
    isError: true as const,
  };
}

export function registerChargeTools(server: McpServer, garu: Garu): void {
  server.tool(
    "create_pix_charge",
    "Create a PIX charge. Returns a QR code for the customer to pay.",
    {
      productId: z.string().uuid().describe("Product UUID"),
      customer: customerSchema,
      additionalInfo: z.string().optional().describe("Free-form metadata"),
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
    "create_card_charge",
    "Create a credit card charge with installment support.",
    {
      productId: z.string().uuid().describe("Product UUID"),
      customer: customerSchema,
      cardInfo: cardInfoSchema,
      additionalInfo: z.string().optional(),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          productId: string;
          customer: Customer;
          cardInfo: CardInfo;
          additionalInfo?: string;
        };
        const charge = await garu.charges.create({
          productId: params.productId,
          paymentMethod: "credit_card",
          customer: params.customer,
          cardInfo: params.cardInfo,
          additionalInfo: params.additionalInfo,
        } as CreateChargeParams);
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
      additionalInfo: z.string().optional(),
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
      status: z.string().optional().describe("Filter by status: pending, paid, refunded, etc."),
      paymentMethod: z.string().optional().describe("Filter: pix, creditcard, boleto"),
      search: z.string().optional().describe("Search by customer name, email, or document"),
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
    "Refund a charge fully or partially. Amount is in BRL (e.g. 10.50 for R$10,50).",
    {
      id: z.number().describe("Charge ID to refund"),
      amount: z
        .number()
        .positive()
        .optional()
        .describe("Partial refund amount in BRL. Omit for full refund."),
      reason: z.string().optional().describe("Reason for the refund"),
    },
    async (args) => {
      try {
        const { id, amount, reason } = args as unknown as {
          id: number;
          amount?: number;
          reason?: string;
        };
        const charge = await garu.charges.refund(id, { amount, reason });
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
