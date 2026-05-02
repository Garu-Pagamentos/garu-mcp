import type {
  CreateScheduledChargeParams,
  Garu,
  ListScheduledChargesParams,
  MarkPaidScheduledChargeParams,
  PauseScheduledChargeParams,
  PostponeScheduledChargeParams,
  ScheduledChargeStatus,
} from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fail, ok } from "./shared.js";

const STATUSES: [ScheduledChargeStatus, ...ScheduledChargeStatus[]] = [
  "scheduled",
  "due_today",
  "overdue",
  "paid",
  "paused",
  "canceled",
  "trial",
  "pending_tokenization",
  "recurrence_canceled",
];

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export function registerScheduledChargeTools(server: McpServer, garu: Garu): void {
  server.tool(
    "create_scheduled_charge",
    "Schedule a future charge for an existing customer. Garu emails the customer on the due date with a payment link, and notifies the seller team if it goes overdue. Use list_customers first to find the customerId. Only one_time is supported in this version; recurring lands later. Methods: pix, boleto. Card is not supported here yet (requires customer tokenization).",
    {
      customerId: z.number().describe("Customer ID (must already be linked to the seller)"),
      productId: z
        .number()
        .optional()
        .describe("Optional product to associate with this charge"),
      amount: z
        .number()
        .positive()
        .describe("Decimal BRL (e.g. 297.50). Always pass decimals, never centavos."),
      description: z
        .string()
        .max(500)
        .optional()
        .describe("Free-form text shown on the customer email and payment page"),
      type: z.literal("one_time").describe("Schedule type. Only `one_time` is supported."),
      dueDate: z
        .string()
        .regex(dateRegex)
        .describe("YYYY-MM-DD in São Paulo time. Must be today or future."),
      methods: z
        .array(z.enum(["pix", "boleto"]))
        .min(1)
        .describe("Payment methods to offer the customer."),
      externalReference: z
        .string()
        .max(255)
        .optional()
        .describe("Seller-controlled identifier (deduping, reconciliation)."),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Free-form JSON. Stored as JSONB; not interpreted by Garu."),
    },
    async (args) => {
      try {
        const params = args as unknown as CreateScheduledChargeParams;
        const charge = await garu.scheduledCharges.create(params);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "list_scheduled_charges",
    "List scheduled charges for the authenticated seller, with pagination and filters. Pass status as a single value or an array. Use search to match against the linked customer's name, email, or document.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 20"),
      customerId: z.number().optional().describe("Filter by a single customer ID"),
      status: z
        .union([z.enum(STATUSES), z.array(z.enum(STATUSES)).min(1)])
        .optional()
        .describe(
          "Filter by status. Single value or array. Common values: scheduled, due_today, overdue, paid, paused.",
        ),
      type: z
        .enum(["one_time", "recurring"])
        .optional()
        .describe("Filter by schedule type"),
      dueFrom: z
        .string()
        .regex(dateRegex)
        .optional()
        .describe("YYYY-MM-DD lower bound for dueDate"),
      dueTo: z
        .string()
        .regex(dateRegex)
        .optional()
        .describe("YYYY-MM-DD upper bound for dueDate"),
      search: z
        .string()
        .max(255)
        .optional()
        .describe("Free-text search across customer name, email, or document"),
    },
    async (args) => {
      try {
        const params = args as unknown as ListScheduledChargesParams;
        const result = await garu.scheduledCharges.list(params);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_scheduled_charge",
    "Get a scheduled charge by ID, bundled with its event timeline and any linked Garu transactions. The response shape is { charge, events, transactions }. Unit caveat: charge.amount is decimal BRL (e.g. 297.50) but transactions[].value is centavos (BRL × 100, e.g. 29750). Convert before comparing.",
    {
      id: z.string().describe("Scheduled charge ID, e.g. sch_abc123"),
    },
    async (args) => {
      try {
        const { id } = args as unknown as { id: string };
        const detail = await garu.scheduledCharges.get(id);
        return ok(detail);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "postpone_scheduled_charge",
    "Postpone a scheduled charge to a new due date. Allowed from scheduled / due_today / overdue / paused. Clears any pending dunning so the customer gets a fresh reminder on the new date.",
    {
      id: z.string().describe("Scheduled charge ID"),
      newDueDate: z
        .string()
        .regex(dateRegex)
        .describe("YYYY-MM-DD in São Paulo time. Must be today or future."),
      reason: z.string().max(500).optional().describe("Free-form reason for the audit log"),
    },
    async (args) => {
      try {
        const { id, ...rest } = args as unknown as {
          id: string;
        } & PostponeScheduledChargeParams;
        const charge = await garu.scheduledCharges.postpone(id, rest);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "pause_scheduled_charge",
    "Pause a scheduled charge. No reminders fire while paused. Allowed from scheduled / due_today / overdue. Use resume_scheduled_charge to bring it back.",
    {
      id: z.string().describe("Scheduled charge ID"),
      reason: z.string().max(500).optional().describe("Free-form reason for the audit log"),
    },
    async (args) => {
      try {
        const { id, ...rest } = args as unknown as {
          id: string;
        } & PauseScheduledChargeParams;
        const charge = await garu.scheduledCharges.pause(id, rest);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "resume_scheduled_charge",
    "Resume a paused scheduled charge. Only valid from `paused`.",
    {
      id: z.string().describe("Scheduled charge ID"),
    },
    async (args) => {
      try {
        const { id } = args as unknown as { id: string };
        const charge = await garu.scheduledCharges.resume(id);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "mark_paid_scheduled_charge",
    "Manually mark a scheduled charge as paid (e.g. customer paid via bank transfer outside Garu). Allowed from due_today / overdue.",
    {
      id: z.string().describe("Scheduled charge ID"),
      paymentDate: z
        .string()
        .regex(dateRegex)
        .describe("YYYY-MM-DD in São Paulo time. Must be today or past."),
      externalReference: z
        .string()
        .max(255)
        .optional()
        .describe("Bank reference, internal ID, or any stable string for reconciliation."),
    },
    async (args) => {
      try {
        const { id, ...rest } = args as unknown as {
          id: string;
        } & MarkPaidScheduledChargeParams;
        const charge = await garu.scheduledCharges.markPaid(id, rest);
        return ok(charge);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
