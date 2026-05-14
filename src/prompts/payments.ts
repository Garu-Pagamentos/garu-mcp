import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "create_pix_charge",
    "Criar cobranca PIX para um cliente",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: "Crie uma cobranca PIX. Pergunte ao usuario o nome, email, CPF, telefone do cliente e o UUID do produto. Depois use a ferramenta create_pix_charge.",
            },
          },
        ],
      };
    },
  );

  server.prompt(
    "list_recent_charges",
    "Listar as ultimas cobrancas",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: "Liste as cobranças mais recentes usando a ferramenta list_charges. Mostre o status, valor e metodo de pagamento de cada uma.",
            },
          },
        ],
      };
    },
  );

  server.prompt(
    "setup_integration",
    "Guiar a configuração da integração com a Garu (API key + webhook)",
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text:
                "Quero integrar minha aplicação com a Garu. " +
                "Use a ferramenta get_integration_setup (ou leia o recurso garu://docs/integration-setup) " +
                "para listar, em passos numerados, como criar a chave de API em " +
                "https://garu.com.br/configuracoes/desenvolvedores e como cadastrar um webhook + segredo de assinatura. " +
                "Em seguida, pergunte se a aplicação já recebe webhooks; se não, mostre o exemplo em Node.js " +
                "usando Garu.webhooks.verify e oriente onde colocar GARU_API_KEY e GARU_WEBHOOK_SECRET.",
            },
          },
        ],
      };
    },
  );
}
