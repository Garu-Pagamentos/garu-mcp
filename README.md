# @garuhq/mcp

[![npm version](https://img.shields.io/npm/v/@garuhq/mcp)](https://www.npmjs.com/package/@garuhq/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

An MCP server for the [Garu](https://garu.com.br) payment platform. Create charges, manage customers, and discover products — directly from any MCP client like Claude Desktop, Cursor, or Claude Code.

## Features

- **PIX Charges** — Create instant PIX charges with auto-generated QR codes for Brazilian real-time payments.
- **Boleto Charges** — Generate boleto bancário payment slips.
- **Charge Management** — List, retrieve, and refund charges (full or partial).
- **Products** — List your seller's products and look them up by UUID — the same UUID accepted by the charge tools.
- **Customers** — Create, list, get, update, and remove customers linked to your seller account.

## Setup

Create a Garu account and get your API key at [garu.com.br](https://garu.com.br).

## Usage

### Claude Code

```bash
claude mcp add garu -e GARU_API_KEY=sk_live_xxx -- npx -y --package=@garuhq/mcp@latest garu-mcp
```

### Cursor

Open the command palette and choose "Cursor Settings" > "MCP" > "Add new global MCP server".

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "--package=@garuhq/mcp@latest", "garu-mcp"],
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
      "args": ["-y", "--package=@garuhq/mcp@latest", "garu-mcp"],
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
      "args": ["-y", "--package=@garuhq/mcp@latest", "garu-mcp"],
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
      "args": ["-y", "--package=@garuhq/mcp@latest", "garu-mcp"],
      "env": {
        "GARU_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

### Codex

```bash
codex mcp add garu --env GARU_API_KEY=sk_live_xxx -- npx -y --package=@garuhq/mcp@latest garu-mcp
```

## Tools

### Products (5 tools)

| Tool | Description |
|------|-------------|
| `list_products` | List your seller's products with pagination and search |
| `get_product` | Get a single product by UUID — the identifier accepted by the charge tools |
| `get_product_portal_config` | Read per-product portal customization (B2B2C, v0.8.0). Returns `null` if unset — product falls back to seller-level config |
| `set_product_portal_config` | Upsert with merge: only fields provided are written. Pass `null` on a field to inherit from seller |
| `clear_product_portal_config` | Remove the per-product config; product falls back to seller-level config |

> Use `list_products` to discover the UUID you'll pass to `create_pix_charge` or `create_boleto_charge`.
>
> Per-product portal config is the **B2B2C primitive**: SaaS that models professionals/coaches/instructors as Products under one Seller can give each one custom branding (`businessName`, `primaryColor`, `logoUrl`) and policies on the customer payment page + `/minha-area` portal — all without fragmenting the seller's accounting.

### Charges (5 tools)

| Tool | Description |
|------|-------------|
| `create_pix_charge` | Create a PIX charge with QR code |
| `create_boleto_charge` | Create a boleto bancário charge |
| `list_charges` | List charges with pagination and filters |
| `get_charge` | Get charge details by ID (includes `status`) |
| `refund_charge` | Refund a charge (full or partial) |

### Customers (6 tools)

| Tool | Description |
|------|-------------|
| `create_customer` | Create a customer linked to your seller account |
| `list_customers` | List customers with search and pagination |
| `get_customer` | Get customer details by ID |
| `update_customer` | Update customer information |
| `delete_customer` | Remove customer from your seller account |
| `set_customer_billing_email_override` | Override the billing-email used for that customer |

### Scheduled charges (12 tools)

Bill an existing customer on a future date — one-time or recurring with card tokenization.

| Tool | Description |
|------|-------------|
| `create_scheduled_charge` | Schedule a future charge. `type='recurring'` enables silent-charge of saved card on cycle 2+ |
| `list_scheduled_charges` | Paginated list with filters by status, type, due-date range, customer |
| `get_scheduled_charge` | Detail bundle: charge + event timeline + linked transactions |
| `mark_paid_scheduled_charge` | Mark a cycle paid (off-Garu reconciliation) |
| `postpone_scheduled_charge` | Move next due date forward |
| `pause_scheduled_charge` / `resume_scheduled_charge` | Suspend / re-enable a series |
| `cancel_recurrence_scheduled_charge` | Hard-stop future cycles (recurring only) |
| `cancel_at_period_end_scheduled_charge` | Stripe-style soft-cancel; reversible |
| `change_scheduled_charge_payment_method` | Swap the saved card |
| `clear_scheduled_charge_payment_method` | Remove saved card; future cycles email-with-link |
| `list_scheduled_charge_attempts` | Per-attempt billing log (v0.8.2). Each row carries the canonical `failureCode` for declines — use this to debug recurring billing failures without joining Transactions |

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
