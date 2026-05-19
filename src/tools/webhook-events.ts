import type {
  Garu,
  ListWebhookEventsParams,
  WebhookEventStatus,
} from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { fail, ok } from "./shared.js";

const STATUSES: [WebhookEventStatus, ...WebhookEventStatus[]] = [
  "pending",
  "success",
  "failed",
];

export function registerWebhookEventTools(
  server: McpServer,
  garu: Garu,
): void {
  server.tool(
    "list_webhook_events",
    "List webhook events for the authenticated seller. Filter by delivery status (pending, success, failed), by Garu event type (e.g. 'transaction.payment.paid'), and/or by the destination endpoint id. Use this to audit deliveries — the canonical 'did my customer's endpoint actually receive event X?' workflow. Newest first.",
    {
      page: z.number().int().min(1).optional().describe("Page number, default 1"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page, default 50"),
      status: z
        .enum(STATUSES)
        .optional()
        .describe(
          "Filter by delivery state. 'pending' = queued/awaiting retry; 'success' = endpoint returned 2xx; 'failed' = retries exhausted.",
        ),
      event_type: z
        .string()
        .max(255)
        .optional()
        .describe(
          "Filter by Garu event type, e.g. 'transaction.payment.paid' or 'scheduled_charge.cycle_failed'.",
        ),
      endpoint_id: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Filter by destination endpoint id"),
    },
    async (args) => {
      try {
        const raw = args as {
          page?: number;
          limit?: number;
          status?: WebhookEventStatus;
          event_type?: string;
          endpoint_id?: number;
        };
        const params: ListWebhookEventsParams = {};
        if (raw.page !== undefined) params.page = raw.page;
        if (raw.limit !== undefined) params.limit = raw.limit;
        if (raw.status !== undefined) params.status = raw.status;
        if (raw.event_type !== undefined) params.eventType = raw.event_type;
        if (raw.endpoint_id !== undefined) params.endpointId = raw.endpoint_id;
        const result = await garu.webhookEvents.list(params);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_webhook_event",
    "Fetch one webhook event by numeric id. Returns the full payload, the embedded endpoint snapshot, the most recent response status/body, and the retry schedule. Use this to drill into why a delivery is failing.",
    {
      id: z.number().int().positive().describe("Webhook event id"),
    },
    async (args) => {
      try {
        const { id } = args as { id: number };
        const event = await garu.webhookEvents.get(id);
        return ok(event);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "retry_webhook_event",
    "Re-deliver a webhook event by id. Resets it to 'pending' in place, clears the retry schedule, and triggers an immediate delivery attempt. Works on any status (success, failed, pending). For most cases prefer resend_webhook_event, which preserves the original event's audit trail by cloning instead of mutating — retry overwrites the historical response status/body on the source row. Kept for callers that explicitly want the legacy in-place semantics.",
    {
      id: z.number().int().positive().describe("Webhook event id"),
    },
    async (args) => {
      try {
        const { id } = args as { id: number };
        const event = await garu.webhookEvents.retry(id);
        return ok(event);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "resend_webhook_event",
    "Re-deliver a webhook event by id, audit-trail preserving. Inserts a fresh event (new numeric id) that points back at the source via manualResendOf, then dispatches that clone — the original row is left untouched, so its prior response status/body stays on the record. Works on any status (success, failed, pending). Returns the clone event; the returned id is the new event's id, NOT the source. The customer's webhook handler will see Idempotency-Key: resend_<original-id> on the delivery, and can distinguish a resend from the original by that prefix or by the payload's manualResendOf field. Prefer this over retry_webhook_event when a customer reports a missed or unprocessed event, or during a backfill — you want the original delivery outcome to remain on the record.",
    {
      id: z.number().int().positive().describe("Webhook event id of the source event to clone and resend"),
    },
    async (args) => {
      try {
        const { id } = args as { id: number };
        const event = await garu.webhookEvents.resend(id);
        return ok(event);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
