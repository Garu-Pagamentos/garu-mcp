import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { NODE_WEBHOOK_EXAMPLE } from "../tools/integration.js";

const QUICKSTART = `# Garu Quickstart

## 1. Get an API key
Create an API key at https://garu.com.br/configuracoes/desenvolvedores and export it as
\`GARU_API_KEY\` in the integrating application. The MCP server reads this from the environment.

For full integration setup (API key + webhooks + signature verification), read the
\`garu://docs/integration-setup\` resource or call the \`get_integration_setup\` tool.

## 2. Find your product
Use \`list_products\` to see your products and copy the UUID of the one you want to charge.
Use \`get_product\` to inspect a single product (price, payment methods, etc.).

## 3. Create a PIX charge
Use the \`create_pix_charge\` tool with the product UUID from step 2 and customer info.

## 4. Check charge status
Use \`get_charge\` with the charge ID to check payment status.

## 5. List your charges
Use \`list_charges\` to see all charges with optional filters.

## 6. Receive webhooks
Register a webhook endpoint at https://garu.com.br/configuracoes/desenvolvedores, copy the
signing secret to \`GARU_WEBHOOK_SECRET\`, and verify every incoming request with
\`Garu.webhooks.verify({ payload, signature, secret })\` from \`@garuhq/node\` — \`signature\` is
the value of the \`X-Garu-Signature\` header.

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

const INTEGRATION_SETUP = `# Garu integration setup

Garu does **not** expose programmatic endpoints to create API keys or webhooks — both have to be
configured in the dashboard. This page lists every step an integrating application needs.

> Note: the MCP server itself only requires \`GARU_API_KEY\`. \`GARU_WEBHOOK_SECRET\` lives in the
> application that receives Garu's HTTP callbacks, not in the MCP server process.

---

## English

### 1. API key

1. Open https://garu.com.br/configuracoes/desenvolvedores while signed into your Garu account.
2. Create a new API key. Use a \`sk_live_\` key for production and \`sk_test_\` for sandbox.
3. Copy the secret — Garu only shows it once.
4. Export it as \`GARU_API_KEY\` in the integrating application (and in any MCP client config).
5. Never commit the key. Rotate it from the same page if it ever leaks.

### 2. Webhook + signing secret

1. From the same page, open the **Webhooks** section.
2. Create a new endpoint pointing at your app, e.g. \`https://your-app.com/webhooks/garu\`.
3. Pick the events you want — see the dashboard for the full list of available events.
4. Copy the generated signing secret and store it as \`GARU_WEBHOOK_SECRET\`.
5. Verify every request with \`Garu.webhooks.verify({ payload, signature, secret })\` before
   trusting it. \`payload\` must be the raw request body (do **not** re-serialize parsed JSON) and
   \`signature\` is the value of the \`X-Garu-Signature\` header (format \`t=<ts>,v1=<hex>\`).
   The SDK computes \`HMAC-SHA256\` over \`\${timestamp}.\${payload}\` and compares it to \`v1\`.
6. Return HTTP 2xx within a few seconds. Non-2xx responses are retried with exponential backoff.

### 3. Node.js example

\`\`\`ts
${NODE_WEBHOOK_EXAMPLE}
\`\`\`

---

## Português (Brasil)

### 1. Chave de API

1. Abra https://garu.com.br/configuracoes/desenvolvedores logado na sua conta Garu.
2. Crie uma nova chave de API. Use \`sk_live_\` para produção e \`sk_test_\` para sandbox.
3. Copie o segredo — a Garu mostra o valor apenas uma vez.
4. Exporte como \`GARU_API_KEY\` na aplicação que está integrando (e na config do cliente MCP).
5. Nunca commite a chave. Se vazar, gere uma nova na mesma página.

### 2. Webhook + segredo de assinatura

1. Na mesma página, abra a seção **Webhooks**.
2. Crie um endpoint apontando para sua aplicação, ex.: \`https://sua-app.com/webhooks/garu\`.
3. Selecione os eventos desejados — consulte o dashboard para a lista completa de eventos disponíveis.
4. Copie o segredo gerado e guarde como \`GARU_WEBHOOK_SECRET\`.
5. Valide toda requisição com \`Garu.webhooks.verify({ payload, signature, secret })\` antes de
   processá-la. \`payload\` deve ser o corpo bruto da requisição (**não** re-serialize o JSON já parseado)
   e \`signature\` é o valor do header \`X-Garu-Signature\` (formato \`t=<ts>,v1=<hex>\`).
   O SDK calcula \`HMAC-SHA256\` sobre \`\${timestamp}.\${payload}\` e compara com \`v1\`.
6. Responda HTTP 2xx em poucos segundos. Respostas não-2xx sofrem retry com backoff exponencial.

### 3. Exemplo em Node.js

Veja o snippet acima (\`Garu.webhooks.verify\`). É o mesmo código para ambos os idiomas.
`;

export function registerResources(server: McpServer): void {
  server.resource(
    "quickstart",
    "garu://docs/quickstart",
    { mimeType: "text/markdown" },
    async () => {
      return {
        contents: [
          {
            uri: "garu://docs/quickstart",
            mimeType: "text/markdown",
            text: QUICKSTART,
          },
        ],
      };
    },
  );

  server.resource(
    "integration-setup",
    "garu://docs/integration-setup",
    { mimeType: "text/markdown" },
    async () => {
      return {
        contents: [
          {
            uri: "garu://docs/integration-setup",
            mimeType: "text/markdown",
            text: INTEGRATION_SETUP,
          },
        ],
      };
    },
  );

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
