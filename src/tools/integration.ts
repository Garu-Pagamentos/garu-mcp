import type { Garu } from "@garuhq/node";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { ok } from "./shared.js";

const DASHBOARD_URL = "https://garu.com.br/configuracoes/desenvolvedores";

export const NODE_WEBHOOK_EXAMPLE = `import express from "express";
import { Garu, GaruSignatureVerificationError } from "@garuhq/node";

const app = express();

app.post(
  "/webhooks/garu",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const { event } = Garu.webhooks.verify({
        payload: req.body,
        signature: (req.header("x-garu-signature") ?? ""),
        secret: process.env.GARU_WEBHOOK_SECRET!,
      });
      // handle event here
      res.status(200).end();
    } catch (err) {
      if (err instanceof GaruSignatureVerificationError) {
        return res.status(400).end();
      }
      throw err;
    }
  },
);`;

const SETUP_PAYLOAD = {
  apiKey: {
    envVar: "GARU_API_KEY",
    dashboardUrl: DASHBOARD_URL,
    steps: [
      `Open ${DASHBOARD_URL} while signed into your Garu account.`,
      "Create a new API key (prefix `sk_live_` for production, `sk_test_` for sandbox).",
      "Copy the secret value — Garu only shows it once.",
      "Store it as the `GARU_API_KEY` environment variable in the integrating application.",
      "Never commit the key to source control; rotate it from the same page if it leaks.",
    ],
  },
  webhook: {
    secretEnvVar: "GARU_WEBHOOK_SECRET",
    dashboardUrl: DASHBOARD_URL,
    signatureAlgorithm: "HMAC-SHA256 over `${timestamp}.${payload}`",
    signatureHeader: "X-Garu-Signature",
    signatureHeaderFormat: "t=<timestamp>,v1=<hex_signature>",
    knownEventExamples: [
      "transaction.payment.failed",
      "scheduled_charge.cycle_failed",
      "payment_method.expiring_soon",
      "payment_method.expired",
    ],
    steps: [
      `Open ${DASHBOARD_URL} and go to the Webhooks section.`,
      "Create a new webhook endpoint pointing at your application's public URL (e.g. https://your-app.com/webhooks/garu).",
      "Select the events you want to receive — see the dashboard for the full list of available events.",
      "Copy the generated signing secret and store it as `GARU_WEBHOOK_SECRET` in the integrating application.",
      "Verify every incoming request with `Garu.webhooks.verify({ payload, signature, secret })` before trusting it. `payload` must be the raw request body (not re-serialized JSON) and `signature` is the value of the `X-Garu-Signature` header.",
      "Return HTTP 2xx within a few seconds; Garu retries non-2xx responses with exponential backoff.",
    ],
    nodeExample: NODE_WEBHOOK_EXAMPLE,
  },
  notes: [
    "Garu's API does not expose endpoints to create API keys or webhooks programmatically — both must be set up through the dashboard.",
    "The MCP server itself only needs `GARU_API_KEY`. `GARU_WEBHOOK_SECRET` lives in the integrating application that receives Garu's HTTP callbacks.",
    "Recurring payments: Garu supports card-on-file (via create_scheduled_charge) and Pix Automático (BACEN auto-debit recurring Pix). Enable Pix Automático per product (the product's `pixAutomatic` flag, surfaced by get_product / list_products) for the public subscription checkout, or include `pix_automatic` in a recurring scheduled charge's `methods`.",
  ],
};

export function registerIntegrationTools(server: McpServer, _garu: Garu): void {
  server.tool(
    "get_integration_setup",
    "Return the steps and dashboard URLs an agent needs to integrate an application with Garu: " +
      "where to create an API key, where to register a webhook endpoint, and how to verify webhook " +
      "signatures with the SDK. Garu does not expose programmatic endpoints for these — both have to " +
      "be done in the dashboard at https://garu.com.br/configuracoes/desenvolvedores. " +
      "Call this whenever the user asks how to wire up Garu in their app, set up the API key, or receive webhooks.",
    {},
    async () => {
      return ok(SETUP_PAYLOAD);
    },
  );
}
