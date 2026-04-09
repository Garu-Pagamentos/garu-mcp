import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Garu } from "@garuhq/node";

import { registerPrompts } from "./prompts/payments.js";
import { registerResources } from "./resources/docs.js";
import { registerChargeTools } from "./tools/charges.js";
import { registerCustomerTools } from "./tools/customers.js";

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
        "Garu is a Brazilian payment gateway. Use the charge tools to create PIX or boleto payments. " +
        "Use customer tools to manage your customer base. All monetary values are in BRL (Brazilian Real). " +
        "PIX is the most popular payment method in Brazil — prefer it when the user doesn't specify.",
    },
  );

  registerChargeTools(server, garu);
  registerCustomerTools(server, garu);
  registerResources(server);
  registerPrompts(server);

  return server;
}
