# @garuhq/mcp

[![npm version](https://img.shields.io/npm/v/@garuhq/mcp)](https://www.npmjs.com/package/@garuhq/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

An MCP server for the [Garu](https://garu.com.br) payment platform. Create charges, manage customers, and process payments via PIX, credit card, and boleto — directly from any MCP client like Claude Desktop, Cursor, or Claude Code.

## Features

- **PIX Charges** — Create instant PIX charges with auto-generated QR codes for Brazilian real-time payments.
- **Credit Card Charges** — Process card payments with support for 1–12 installments.
- **Boleto Charges** — Generate boleto bancário payment slips.
- **Charge Management** — List, retrieve, and refund charges (full or partial).
- **Customers** — Create, list, get, update, and remove customers linked to your seller account.

## Setup

Create a Garu account and get your API key at [garu.com.br](https://garu.com.br).

## Usage

### Claude Code

```bash
claude mcp add garu -e GARU_API_KEY=sk_live_xxx -- npx -y @garuhq/mcp
```

### Cursor

Open the command palette and choose "Cursor Settings" > "MCP" > "Add new global MCP server".

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "@garuhq/mcp"],
      "env": {
        "GARU_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

### Windsurf

Add to `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "@garuhq/mcp"],
      "env": {
        "GARU_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "@garuhq/mcp"],
      "env": {
        "GARU_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

### Claude Desktop

Open Claude Desktop settings > "Developer" tab > "Edit Config".

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "@garuhq/mcp"],
      "env": {
        "GARU_API_KEY": "sk_live_xxx"
      }
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
| `create_card_charge` | Create a credit card charge (1–12 installments) |
| `create_boleto_charge` | Create a boleto bancário charge |
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

### Resources

- `garu://docs/quickstart` — Getting started guide
- `garu://docs/openapi` — Link to the OpenAPI spec

### Environment Variables

- `GARU_API_KEY` — Your Garu API key (required). Get yours at [garu.com.br](https://garu.com.br).

## Local Development

1. Clone and build:

```bash
git clone https://github.com/Garu-Pagamentos/garu-mcp.git
npm install
npm run build
```

2. To use the local build, replace the `npx` command with the path to your local build:

**Claude Code:**

```bash
claude mcp add garu -e GARU_API_KEY=sk_live_xxx -- node /absolute/path/to/garu-mcp/dist/index.js
```

**Cursor / VS Code / Windsurf / Claude Desktop:**

```json
{
  "mcpServers": {
    "garu": {
      "command": "node",
      "args": ["/absolute/path/to/garu-mcp/dist/index.js"],
      "env": {
        "GARU_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

3. Run tests:

```bash
npm test
```

## License

MIT
