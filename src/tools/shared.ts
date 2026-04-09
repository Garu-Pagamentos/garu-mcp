import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().max(255).describe("Customer full name"),
  email: z.string().email().max(255).describe("Customer email"),
  document: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/)
    .describe("CPF (11 digits) or CNPJ (14 digits)"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/)
    .describe("Phone with area code, 10-11 digits"),
  zipCode: z.string().regex(/^\d{8}$/).optional().describe("ZIP code, 8 digits"),
  street: z.string().max(255).optional(),
  number: z.string().max(20).optional(),
  complement: z.string().max(255).optional(),
  neighborhood: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  state: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("2-letter state code, e.g. SP"),
});

export function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function fail(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const safe = message
    .replace(/https?:\/\/\S+/g, "[redacted-url]")
    .replace(/(?:^|[\s"'(])(\/([\w.-]+\/){2,}[\w.-]*)/g, " [redacted-path]")
    .replace(/at .+\(.+\)/g, "")
    .split("\n")[0]
    .slice(0, 500);
  return {
    content: [{ type: "text" as const, text: `Error: ${safe}` }],
    isError: true as const,
  };
}
