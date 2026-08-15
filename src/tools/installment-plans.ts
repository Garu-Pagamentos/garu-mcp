import type {
  CreateInstallmentPlanParams,
  Garu,
  InstallmentPlanStatus,
  ListInstallmentPlansParams,
} from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fail, ok } from "./shared.js";

const STATUSES: [InstallmentPlanStatus, ...InstallmentPlanStatus[]] = [
  "pending_activation",
  "active",
  "completed",
  "defaulted",
  "canceled",
  "refunded",
];

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export function registerInstallmentPlanTools(
  server: McpServer,
  garu: Garu,
): void {
  server.tool(
    "create_installment_plan",
    "Sell a product as a carnê: one product paid with N monthly bank slips (boleto parcelado). This is SELLER-FINANCED credit, not a card instalment — nobody guarantees a boleto, so if the buyer stops paying at parcela 4 the seller keeps four parcelas and loses the rest. Only the FIRST boleto is registered now; the rest are emitted month by month, and the sale activates when parcela 1 compensates. The product must have carnê enabled. Use list_products for the productId and list_customers for the customerId. Idempotent: the SDK attaches a key automatically, so a retry cannot register a second real boleto.",
    {
      productId: z
        .string()
        .describe("Product UUID. The product must have carnê enabled."),
      customerId: z
        .number()
        .describe("Numeric customer id (must already be linked to the seller)"),
      installments: z
        .number()
        .int()
        .min(2)
        .max(12)
        .describe(
          "Number of monthly slips, 2..12. One parcela is not a carnê; the platform ceiling is 12 and a seller may set a lower one per product.",
        ),
      firstDueDate: z
        .string()
        .regex(dateRegex)
        .optional()
        .describe(
          "YYYY-MM-DD in São Paulo time. Defaults to today, must be within 90 days. Later parcelas land on the same day of each following month, computed from this anchor so a Jan-31 carnê does not drift after February.",
        ),
      affiliateId: z
        .number()
        .optional()
        .describe(
          "The affiliate who made this sale. FIXED at sale time: every later parcela inherits it, so omitting it pays that affiliate nothing for the whole carnê. Must already have an active affiliation on this product, otherwise the call is refused rather than silently dropping the attribution.",
        ),
    },
    async (args) => {
      try {
        const plan = await garu.installmentPlans.create(
          args as CreateInstallmentPlanParams,
        );
        return ok(plan);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "list_installment_plans",
    "List carnês for the authenticated seller, newest first. dueFrom/dueTo filter on the FIRST parcela's due date, which is what identifies the plan — filtering on every parcela would return one carnê twelve times. Pass status as a single value or an array.",
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
          "pending_activation = created, parcela 1 not yet paid. active = running. defaulted = the oldest unpaid parcela outlived its grace window.",
        ),
      customerId: z.number().optional().describe("Filter by customer id"),
      productId: z.string().optional().describe("Filter by product UUID"),
      dueFrom: z
        .string()
        .regex(dateRegex)
        .optional()
        .describe("First parcela due on or after this date (YYYY-MM-DD)"),
      dueTo: z
        .string()
        .regex(dateRegex)
        .optional()
        .describe("First parcela due on or before this date (YYYY-MM-DD)"),
    },
    async (args) => {
      try {
        const result = await garu.installmentPlans.list(
          args as ListInstallmentPlansParams,
        );
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "get_installment_plan",
    "Retrieve one carnê with every parcela: due date, status, barcode line and boleto PDF. Note totalCollected (what actually cleared) against totalScheduled (what the carnê bills) — they differ once a bank adds multa or mora, so totalCollected can legitimately exceed totalScheduled.",
    { uuid: z.string().describe("Installment plan UUID") },
    async ({ uuid }) => {
      try {
        return ok(await garu.installmentPlans.get(uuid));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "reissue_plan_installment",
    "Issue a segunda via (replacement boleto) for one parcela, once the current slip has expired. Garu refuses while the old barcode is still live: a boleto stays payable at any bank until its due date plus five days, and two live barcodes for one parcela is how a buyer pays it twice. Allowed once per parcela per day.",
    {
      uuid: z.string().describe("Installment plan UUID"),
      number: z.number().int().min(1).describe("Parcela number, 1-based"),
    },
    async ({ uuid, number }) => {
      try {
        return ok(await garu.installmentPlans.reissueInstallment(uuid, number));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "postpone_plan_installment",
    "Move ONE parcela to a later date. Its siblings keep their dates — this postpones a payment, it does not restructure the carnê. A slip already emitted stays payable on its original date until it expires.",
    {
      uuid: z.string().describe("Installment plan UUID"),
      number: z.number().int().min(1).describe("Parcela number, 1-based"),
      newDueDate: z
        .string()
        .regex(dateRegex)
        .describe("New due date, YYYY-MM-DD"),
    },
    async ({ uuid, number, newDueDate }) => {
      try {
        return ok(
          await garu.installmentPlans.postponeInstallment(uuid, number, {
            newDueDate,
          }),
        );
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "mark_plan_installment_paid",
    "Record a parcela as paid, for when the buyer paid the slip but the webhook never arrived. Garu asks the provider to confirm the charge really compensated before recording it, because this settles the transaction and pays affiliate and co-producer commissions. A provider outage refuses the action rather than trusting the assertion.",
    {
      uuid: z.string().describe("Installment plan UUID"),
      number: z.number().int().min(1).describe("Parcela number, 1-based"),
    },
    async ({ uuid, number }) => {
      try {
        return ok(
          await garu.installmentPlans.markInstallmentPaid(uuid, number),
        );
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "cancel_installment_plan",
    "Cancel the carnê. Emission and reminders stop and open slips are cancelled at the provider. Money already collected is NOT returned — use request_plan_refund for that. A cancelled carnê is never revived by a late payment; money arriving afterwards opens a refund request instead.",
    {
      uuid: z.string().describe("Installment plan UUID"),
      note: z
        .string()
        .max(500)
        .optional()
        .describe("Recorded on the cancellation event for the audit trail"),
    },
    async ({ uuid, note }) => {
      try {
        return ok(await garu.installmentPlans.cancel(uuid, { note }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.tool(
    "request_plan_refund",
    "Ask for a carnê to be refunded. Garu does NOT move this money: a boleto cannot be reversed and the funds already settled to the seller, so the return is a bank transfer only they can make. This records the request and notifies the seller team. The carnê KEEPS RUNNING while the request is pending — future parcelas still emit. Transfer the money, then close it with confirm_refund_request.",
    {
      uuid: z.string().describe("Installment plan UUID"),
      amount: z
        .number()
        .positive()
        .optional()
        .describe(
          "Decimal BRL. Defaults to everything the carnê has actually collected, which is NOT the same as what it was scheduled to bill.",
        ),
      reason: z.string().max(500).optional().describe("Why it was asked for"),
    },
    async ({ uuid, amount, reason }) => {
      try {
        return ok(
          await garu.installmentPlans.requestRefund(uuid, { amount, reason }),
        );
      } catch (err) {
        return fail(err);
      }
    },
  );
}
