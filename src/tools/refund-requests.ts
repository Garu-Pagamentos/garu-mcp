import type {
  Garu,
  ListRefundRequestsParams,
  RefundRequestStatus,
} from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fail, ok } from "./shared.js";

const STATUSES: [RefundRequestStatus, ...RefundRequestStatus[]] = [
  "pending",
  "confirmed",
  "rejected",
];

export function registerRefundRequestTools(
  server: McpServer,
  garu: Garu,
): void {
  server.tool(
    "list_refund_requests",
    "List refunds Garu has been asked to make. Garu does NOT move this money: a boleto cannot be reversed and Celcoin exposes no Pix devolução, so the funds already settled to the seller and the return is a bank transfer only they can make. Covers carnê and Pix/boleto charges alike. Filter status='pending' to answer 'what do I still owe a buyer'. Card and Woovi Pix never appear here — they have real automated reversals via refund_charge.",
    {
      page: z.number().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 20"),
      status: z
        .union([z.enum(STATUSES), z.array(z.enum(STATUSES))])
        .optional()
        .describe(
          "pending = asked for, money not yet returned. confirmed = the seller asserts they sent it. rejected = declined.",
        ),
      planId: z.string().optional().describe("Filter by carnê (plan) UUID"),
      chargeId: z
        .string()
        .optional()
        .describe("Filter by charge UUID (Pix and boleto requests)"),
    },
    async (args) => {
      try {
        return ok(
          await garu.refundRequests.list(args as ListRefundRequestsParams),
        );
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_refund_request",
    "Retrieve one refund request. Exactly one of installmentPlanId or chargeId is set, depending on whether the refund is for a carnê or for a single Pix/boleto charge.",
    { uuid: z.string().describe("Refund request UUID") },
    async ({ uuid }) => {
      try {
        return ok(await garu.refundRequests.get(uuid));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "confirm_refund_request",
    "Record that the seller HAS ALREADY returned the money. Call this only after the transfer actually happened — Garu never observes it and takes the seller's word. Confirming closes a carnê as refunded, stops remaining parcelas, cancels open slips at the provider and claws back affiliate and co-producer commissions on the parcelas that cleared; for a Pix or boleto charge it marks the charge reversed. Idempotent: confirming twice does not claw back twice.",
    {
      uuid: z.string().describe("Refund request UUID"),
      note: z
        .string()
        .max(500)
        .optional()
        .describe(
          "Recorded against the resolution for the audit trail, e.g. the Pix end-to-end id of the transfer",
        ),
    },
    async ({ uuid, note }) => {
      try {
        return ok(await garu.refundRequests.confirm(uuid, { note }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "reject_refund_request",
    "Decline a refund request. The carnê is untouched and keeps running exactly as it was; the fact that a refund was asked for is deliberately not erased. Idempotent.",
    {
      uuid: z.string().describe("Refund request UUID"),
      note: z
        .string()
        .max(500)
        .optional()
        .describe("Why it was declined, recorded for the audit trail"),
    },
    async ({ uuid, note }) => {
      try {
        return ok(await garu.refundRequests.reject(uuid, { note }));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
