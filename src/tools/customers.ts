import type {
  Garu,
  CreateCustomerParams,
  UpdateCustomerParams,
} from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { customerSchema, ok, fail } from "./shared.js";

export function registerCustomerTools(server: McpServer, garu: Garu): void {
  server.tool(
    "create_customer",
    "Create a customer and link to the current seller. Safe to retry: the SDK attaches an " +
      "idempotency key automatically, so a repeated call returns the original/matched customer " +
      "instead of a duplicate.",
    {
      ...customerSchema.shape,
      personType: z.enum(["fisica", "juridica"]).describe("Person type"),
    },
    async (args) => {
      try {
        const params = args as unknown as CreateCustomerParams;
        const customer = await garu.customers.create(params);
        return ok(customer);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "list_customers",
    "List customers for the authenticated seller with pagination, search, and an optional 'overdue' filter that surfaces customers with at least one overdue scheduled charge.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 20"),
      search: z
        .string()
        .max(255)
        .optional()
        .describe("Search by name, email, or document"),
      status: z
        .literal("overdue")
        .optional()
        .describe(
          "Filter to customers with at least one overdue scheduled charge.",
        ),
    },
    async (args) => {
      try {
        const params = args as unknown as {
          page?: number;
          limit?: number;
          search?: string;
          status?: "overdue";
        };
        const result = await garu.customers.list(params);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_customer",
    "Get details of a specific customer by uuid.",
    { uuid: z.string().uuid().describe("Customer uuid") },
    async (args) => {
      try {
        const { uuid } = args as unknown as { uuid: string };
        const customer = await garu.customers.get(uuid);
        return ok(customer);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "update_customer",
    "Update a customer's information for the current seller.",
    {
      uuid: z.string().uuid().describe("Customer uuid"),
      name: z.string().max(255).optional(),
      email: z.string().email().max(255).optional(),
      phone: z
        .string()
        .regex(/^\d{10,11}$/)
        .optional()
        .describe("Phone with area code"),
      document: z
        .string()
        .regex(/^\d{11}$|^\d{14}$/)
        .optional()
        .describe("CPF (11 digits) or CNPJ (14 digits)"),
      personType: z.enum(["fisica", "juridica"]).optional(),
      zipCode: z
        .string()
        .regex(/^\d{8}$/)
        .optional(),
      street: z.string().max(255).optional(),
      number: z.string().max(20).optional(),
      complement: z.string().max(255).optional(),
      neighborhood: z.string().max(255).optional(),
      city: z.string().max(255).optional(),
      state: z
        .string()
        .regex(/^[A-Z]{2}$/)
        .optional()
        .describe("2-letter state code"),
    },
    async (args) => {
      try {
        const { uuid, ...rest } = args as unknown as {
          uuid: string;
        } & UpdateCustomerParams;
        const customer = await garu.customers.update(uuid, rest);
        return ok(customer);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "set_customer_billing_email_override",
    "Set or clear the per-seller billing email override for a customer. The override is sticky: it takes precedence over the per-seller last-used email and the global customer.email for outbound seller-to-customer emails, and is never auto-overwritten by subsequent payments. Pass null to clear and fall back to the last-used email. Use this when the customer asks for a specific billing address (e.g. financeiro@empresa.com.br) different from the email they used at checkout.",
    {
      uuid: z.string().uuid().describe("Customer uuid"),
      billingEmailOverride: z
        .union([z.string().email().max(255), z.null()])
        .describe(
          "Email to set as the override, or null to clear the override.",
        ),
    },
    async (args) => {
      try {
        const { uuid, billingEmailOverride } = args as unknown as {
          uuid: string;
          billingEmailOverride: string | null;
        };
        const customer = await garu.customers.setBillingEmailOverride(uuid, {
          billingEmailOverride,
        });
        return ok(customer);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "delete_customer",
    "Remove a customer from the current seller. Does not delete the customer globally.",
    { uuid: z.string().uuid().describe("Customer uuid to remove") },
    async (args) => {
      try {
        const { uuid } = args as unknown as { uuid: string };
        const result = await garu.customers.delete(uuid);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
