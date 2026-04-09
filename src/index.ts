import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./server.js";

const apiKey = process.env.GARU_API_KEY;

if (!apiKey) {
  process.stderr.write(
    "Error: GARU_API_KEY environment variable is required.\n" +
      "Get your API key at https://garu.com.br and set it:\n" +
      "  export GARU_API_KEY=sk_live_...\n",
  );
  process.exit(1);
}

const server = createServer({
  apiKey,
  baseUrl: process.env.GARU_BASE_URL,
});

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("Garu MCP server running on stdio\n");
