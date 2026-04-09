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
}
