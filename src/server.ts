import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Garu } from "@garuhq/node";

import { registerPrompts } from "./prompts/payments.js";
import { registerResources } from "./resources/docs.js";
import { registerChargeTools } from "./tools/charges.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerIntegrationTools } from "./tools/integration.js";
import { registerProductTools } from "./tools/products.js";
import { registerScheduledChargeTools } from "./tools/scheduled-charges.js";
import { registerWebhookEventTools } from "./tools/webhook-events.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export interface CreateServerOptions {
  apiKey: string;
  baseUrl?: string;
}

export function createServer(options: CreateServerOptions): McpServer {
  const garu = new Garu({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
  });

  const server = new McpServer(
    {
      name: "garu-mcp",
      version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
      instructions:
        "Garu is a Brazilian payment gateway. Use list_products / get_product to discover the " +
        "product UUIDs you'll need for charge creation. Use the charge tools to create PIX or boleto payments. " +
        "Use customer tools to manage your customer base. " +
        "Use scheduled-charge tools (create_scheduled_charge, list_scheduled_charges, etc.) to bill " +
        "an existing customer on a future date — Garu emails the customer on the due date and alerts " +
        "the seller team if it goes overdue. Schedule amounts are decimal BRL (e.g. 297.50), NOT centavos. " +
        "All monetary values are in BRL (Brazilian Real). " +
        "PIX is the most popular payment method in Brazil — prefer it when the user doesn't specify. " +
        "Use the webhook-event tools (list_webhook_events, get_webhook_event, retry_webhook_event) " +
        "to audit and replay deliveries when a customer reports a missed or unprocessed event. " +
        "When the user asks how to integrate Garu, set up an API key, or create a webhook endpoint, " +
        "call get_integration_setup (or read garu://docs/integration-setup) — webhook endpoint " +
        "creation (URL, subscribed events, secret) is still dashboard-only, but webhook event " +
        "listing and retry are available via the tools above.",
    },
  );

  registerChargeTools(server, garu);
  registerCustomerTools(server, garu);
  registerProductTools(server, garu);
  registerScheduledChargeTools(server, garu);
  registerWebhookEventTools(server, garu);
  registerIntegrationTools(server, garu);
  registerResources(server);
  registerPrompts(server);

  return server;
}
