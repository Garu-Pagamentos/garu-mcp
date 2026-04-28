import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const QUICKSTART = `# Garu Quickstart

## 1. Get an API key
Sign up at https://garu.com.br and create an API key in the dashboard.

## 2. Find your product
Use \`list_products\` to see your products and copy the UUID of the one you want to charge.
Use \`get_product\` to inspect a single product (price, payment methods, etc.).

## 3. Create a PIX charge
Use the \`create_pix_charge\` tool with the product UUID from step 2 and customer info.

## 4. Check charge status
Use \`get_charge\` with the charge ID to check payment status.

## 5. List your charges
Use \`list_charges\` to see all charges with optional filters.

## Payment methods
- **PIX**: Instant payment via QR code (most popular in Brazil)
- **Credit card**: Up to 12 installments
- **Boleto**: Bank slip with 8-day deadline

## Charge statuses
- \`pending\` - Awaiting payment
- \`paid\` / \`payedPix\` / \`captured\` - Payment confirmed
- \`reversed\` - Refunded
- \`canceled\` - Cancelled
- \`notAuthorized\` - Payment denied
`;

export function registerResources(server: McpServer): void {
  server.resource("quickstart", "garu://docs/quickstart", { mimeType: "text/markdown" }, async () => {
    return {
      contents: [
        {
          uri: "garu://docs/quickstart",
          mimeType: "text/markdown",
          text: QUICKSTART,
        },
      ],
    };
  });

  server.resource("openapi", "garu://docs/openapi", { mimeType: "text/plain" }, async () => {
    return {
      contents: [
        {
          uri: "garu://docs/openapi",
          mimeType: "text/plain",
          text: "OpenAPI spec available at: https://garu.com.br/api/swagger-json",
        },
      ],
    };
  });
}
