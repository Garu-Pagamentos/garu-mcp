# @garuhq/mcp

MCP server for the [Garu](https://garu.com.br) payment gateway. Enables AI agents to create charges, manage customers, and process payments via PIX, credit card, and boleto.

## Install

### Claude Code

```bash
claude mcp add garu -e GARU_API_KEY=sk_live_xxx -- npx -y @garuhq/mcp
```

### Cursor / Windsurf / VS Code

Add to `.cursor/mcp.json`, `.windsurf/mcp.json`, or `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "@garuhq/mcp"],
      "env": { "GARU_API_KEY": "sk_live_xxx" }
    }
  }
}
```

### Codex

```bash
codex mcp add garu --env GARU_API_KEY=sk_live_xxx -- npx -y @garuhq/mcp
```

## Tools

### Charges (6 tools)

| Tool | Description |
|------|-------------|
| `create_pix_charge` | Create a PIX charge with QR code |
| `create_card_charge` | Create a credit card charge (1-12 installments) |
| `create_boleto_charge` | Create a boleto bancario charge |
| `list_charges` | List charges with pagination and filters |
| `get_charge` | Get charge details by ID |
| `refund_charge` | Refund a charge (full or partial) |

### Customers (5 tools)

| Tool | Description |
|------|-------------|
| `create_customer` | Create a customer linked to your seller account |
| `list_customers` | List customers with search and pagination |
| `get_customer` | Get customer details by ID |
| `update_customer` | Update customer information |
| `delete_customer` | Remove customer from your seller account |

## Resources

- `garu://docs/quickstart` — Getting started guide
- `garu://docs/openapi` — Link to the OpenAPI spec

## Auth

Set the `GARU_API_KEY` environment variable. Get your key at [garu.com.br](https://garu.com.br).

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
