# Changelog

All notable changes to `@garuhq/mcp` are documented in this file. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

Older releases (≤ 0.4.0) are documented only in the corresponding git tag annotation.

## [0.11.0] — 2026-05-19

### Added

- Three new tools mirroring the `garu.webhookEvents.*` SDK methods
  (requires `@garuhq/node` 0.11.0+). Agents can now audit and replay
  webhook deliveries — the canonical "a customer says they didn't get
  event X, resend it" workflow.
  - `list_webhook_events` — `GET /api/webhook-events`. Filter by
    `status` (`pending` / `success` / `failed`), Garu event type, or
    destination endpoint id.
  - `get_webhook_event` — `GET /api/webhook-events/{id}`. Returns the
    full payload, the embedded endpoint snapshot, and the most recent
    response status/body.
  - `retry_webhook_event` — `POST /api/webhook-events/{id}/retry`.
    Resets the event to `pending` and triggers an immediate delivery
    attempt. Works on any status.
- Server `instructions` updated so agents reach for these tools when a
  user mentions a missed, failed, or unprocessed webhook event. The
  caveat that webhook endpoint *creation* (URL, subscribed events,
  secret) is still dashboard-only is preserved.

### Changed

- Tool count: 29 → 32.

## [0.9.0] — 2026-05-14

### Added

- New integration-setup surface so agents can discover how to wire an
  app to Garu. Garu's API does not expose programmatic endpoints to
  create API keys or webhooks — both have to be configured in the
  dashboard at https://garu.com.br/configuracoes/desenvolvedores, and
  this release documents that path through every MCP affordance:
  - `get_integration_setup` tool — returns a structured payload with
    the dashboard URL, env var conventions (`GARU_API_KEY`,
    `GARU_WEBHOOK_SECRET`), step-by-step instructions for the API key
    and the webhook + signing secret, and a Node.js verification
    example using `Garu.webhooks.verify({ payload, signature, secret })`
    where `signature` is the raw `X-Garu-Signature` header value.
  - `garu://docs/integration-setup` resource — bilingual (English +
    Brazilian Portuguese) markdown guide with the same Node snippet.
  - `setup_integration` prompt — PT-BR prompt that routes the agent
    through the tool and walks the user through env-var placement.
- Quickstart resource (`garu://docs/quickstart`) now links to the
  developers dashboard and includes a `receive webhooks` step.
- Server `instructions` updated so agents reach for
  `get_integration_setup` when the user asks how to integrate Garu, set
  up an API key, or receive webhooks.

### Changed

- Tool count: 28 → 29.

## [0.5.0] — 2026-05-02

### Added

- 7 new scheduled-charge tools, mirroring the `garu.scheduledCharges.*` SDK
  methods (requires `@garuhq/node` 0.5.0+). All amounts are decimal BRL
  (e.g. `297.50`), never centavos.
  - `create_scheduled_charge` — `POST /api/scheduled-charges`. Only
    `type=one_time` and `methods` ∈ {`pix`, `boleto`} are accepted.
  - `list_scheduled_charges` — `GET /api/scheduled-charges`. `status`
    accepts a single value or an array; arrays go on the wire as
    repeated `?status=` params.
  - `get_scheduled_charge` — `GET /api/scheduled-charges/{id}`. Returns
    a bundle: `{ charge, events, transactions }`. Note: `charge.amount`
    is decimal BRL, `transactions[].value` is centavos.
  - `postpone_scheduled_charge` — allowed from `scheduled` /
    `due_today` / `overdue` / `paused`.
  - `pause_scheduled_charge` — allowed from `scheduled` / `due_today` /
    `overdue`.
  - `resume_scheduled_charge` — only valid from `paused`.
  - `mark_paid_scheduled_charge` — record an off-Garu payment. Allowed
    from `due_today` / `overdue`.
- `list_customers` gains an optional `status: "overdue"` filter that
  surfaces customers with at least one overdue scheduled charge.
- Server `instructions` now mention scheduled-charge tooling and the
  decimal-BRL convention so agents don't accidentally pass centavos.
