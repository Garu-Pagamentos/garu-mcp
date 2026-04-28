import { createRequire } from "node:module";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import updateNotifier from "update-notifier";

import { createServer } from "./server.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24,
});

if (notifier.update) {
  process.stderr.write(
    `A new version of ${pkg.name} is available: ${notifier.update.latest} (currently installed ${notifier.update.current}).\n` +
      `Update with: rm -rf ~/.npm/_npx, then restart your MCP client.\n`,
  );
}

const apiKey = process.env.GARU_API_KEY;

if (!apiKey) {
  process.stderr.write(
    "Error: GARU_API_KEY environment variable is required.\n" +
      "Get your API key at https://garu.com.br and set it:\n" +
      "  export GARU_API_KEY=sk_live_...\n",
  );
  process.exit(1);
}

const baseUrl = process.env.GARU_BASE_URL;

if (baseUrl) {
  process.stderr.write(
    `WARNING: GARU_BASE_URL is set to "${baseUrl}". ` +
      "All API calls (including customer PII) will be sent to this URL instead of the Garu production API. " +
      "Only use this for development.\n",
  );
}

const server = createServer({
  apiKey,
  baseUrl,
});

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("Garu MCP server running on stdio\n");
