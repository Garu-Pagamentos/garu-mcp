import type { Garu, CreateCustomerParams, UpdateCustomerParams } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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

export function registerCustomerTools(server: McpServer, garu: Garu): void {
  server.tool(
    "create_customer",
    "Create a customer and link to the current seller.",
    {
      name: z.string().describe("Customer full name"),
      email: z.string().email(),
      document: z
        .string()
        .regex(/^\d{11}$|^\d{14}$/)
        .describe("CPF (11 digits) or CNPJ (14 digits)"),
      phone: z
        .string()
        .regex(/^\d{10,11}$/)
        .describe("Phone with area code"),
      personType: z.enum(["fisica", "juridica"]).describe("Person type"),
      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z
        .string()
        .regex(/^[A-Z]{2}$/)
        .optional()
        .describe("2-letter state code"),
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
    "List customers for the authenticated seller with pagination and search.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z.number().min(1).max(100).optional().describe("Items per page, default 20"),
      search: z.string().optional().describe("Search by name, email, or document"),
    },
    async (args) => {
      try {
        const params = args as unknown as { page?: number; limit?: number; search?: string };
        const result = await garu.customers.list(params);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_customer",
    "Get details of a specific customer by numeric ID.",
    { id: z.number().describe("Customer ID") },
    async (args) => {
      try {
        const { id } = args as unknown as { id: number };
        const customer = await garu.customers.get(id);
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
      id: z.number().describe("Customer ID"),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      document: z.string().optional(),
      personType: z.enum(["fisica", "juridica"]).optional(),
      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    },
    async (args) => {
      try {
        const { id, ...rest } = args as unknown as { id: number } & UpdateCustomerParams;
        const customer = await garu.customers.update(id, rest);
        return ok(customer);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "delete_customer",
    "Remove a customer from the current seller. Does not delete the customer globally.",
    { id: z.number().describe("Customer ID to remove") },
    async (args) => {
      try {
        const { id } = args as unknown as { id: number };
        await garu.customers.delete(id);
        return ok({ success: true, message: "Customer removed from seller" });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
