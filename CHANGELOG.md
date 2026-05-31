# Changelog

All notable changes to `@garuhq/mcp` are documented in this file. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

Older releases (≤ 0.4.0) are documented only in the corresponding git tag annotation.

## [0.15.0] — 2026-05-31

### Added

- `create_product` tool — `garu.products.create()`. Creates a product for the
  authenticated seller and returns it, whose `uuid` is the same identifier
  accepted by `create_pix_charge` / `create_boleto_charge`. Fields are
  camelCase: `name` (required), `value` (centavos — BRL × 100, **not** decimal
  BRL like scheduled charges), `description`, `image` (HTTPS URL), `tags`,
  `pix` / `boleto` / `creditCard` / `pixAutomatic` booleans, `installments`,
  `isSubscription`, `subscriptionType`, `unitLabel`, `returnUrl`,
  `returnUrlButtonText`, `statementDescriptor`, and `idempotencyKey` (safe
  retries). Setting `pixAutomatic: true` exposes Pix Automático (BACEN
  auto-debit recurring Pix) on the subscription checkout.
- `update_product` tool — `garu.products.update(id, params)`. Partial PATCH:
  `productId` accepts the UUID or the legacy positive integer id; every other
  field is optional and only the ones you pass are written. An update with zero
  write fields is rejected before the network call with a clear message.

### Changed

- Tool count: 34 → 36 (5 → 7 product tools).
- Bumped `@garuhq/node` from `0.13.0` to `0.15.0` for `products.create()` /
  `products.update()` and the native `pix_automatic` typing on
  `ScheduledPaymentMethod`. `create_scheduled_charge` now types its params
  directly instead of casting through `unknown` to forward `pix_automatic`.

## [0.14.0] — 2026-05-31

### Added

- **Pix Automático** (BACEN auto-debit recurring Pix) support surfaced through the existing tools — fully additive, no breaking changes:
  - `create_scheduled_charge`: the `methods` array now accepts `pix_automatic`. It is recurring-only and requires `productId` (i.e. `type: "recurring"` + a product). The customer authorizes once, then later cycles debit silently.
  - `get_product` / `list_products`: documented the product `pixAutomatic` boolean, which enables Pix Automático on the public subscription checkout.
  - `garu://docs/integration-setup` resource, the `get_integration_setup` tool output, and the quickstart docs now list Pix Automático as a recurring payment method.
  - No `@garuhq/node` bump required: the SDK's `scheduledCharges.create()` is a thin passthrough, so `pix_automatic` rides the existing request body. The MCP input schema is the source of truth for the new value.

## [0.13.0] — 2026-05-25

### Added

- `charge_now_scheduled_charge` tool — `POST /api/scheduled-charges/{id}/charge-now`.
  Force-bills the current cycle immediately instead of waiting for its due
  date, running the same dispatch the daily billing cron would (customer
  email/notification + outbound webhook + timeline event). Allowed only from
  a billable status (`scheduled` / `due_today`); a recurring series must have
  an open cycle (otherwise the gateway returns 400). **Idempotent — not a
  re-charge:** if the current cycle's d-day was already dispatched it reports
  `outcome: 'already_sent'` and does nothing, so retries never double-bill.
  The result carries `outcome` (`dispatched` / `already_sent` / `not_sent` /
  `failed`), `cycleNumber`, an optional `reason` (e.g. `no_email`,
  `no_saved_payment_method`, `card_expired`, or a gateway decline code), and a
  ready-to-show pt-BR `message`. Requires `@garuhq/node` 0.13.0+.

### Changed

- `create_scheduled_charge` accepts an optional `maxRecoveryDays` (integer
  1–365) — the maximum number of days past `dueDate` the daily recovery sweep
  will still auto-bill a missed charge. Omit it for the system default (14).
  Also surfaced on the returned object as `maxRecoveryDays: number | null`.
- Server `instructions` now point agents at `charge_now_scheduled_charge` for
  immediate billing and call out its idempotency.
- Tool count: 33 → 34.
- Bumped `@garuhq/node` from `0.12.0` to `0.13.0` for the new
  `scheduledCharges.chargeNow()` method and `maxRecoveryDays` create field.

## [0.12.0] — 2026-05-19

### Added

- `resend_webhook_event` tool — `POST /api/webhook-events/{id}/resend`.
  Audit-trail-preserving counterpart to `retry_webhook_event`: instead
  of mutating the original event in place, the gateway inserts a fresh
  event (new numeric id) that points back at the source via
  `manualResendOf`, then dispatches that clone. The original row's prior
  response status/body is left untouched on the record. Returns the
  clone's id. Customer handlers see `Idempotency-Key: resend_<original-id>`
  on the delivery and can distinguish a resend from the original by that
  prefix or by reading `manualResendOf` on the payload. Works on any
  source status (`success` / `failed` / `pending`). Requires
  `@garuhq/node` 0.12.0+.

### Changed

- `retry_webhook_event` description soft-deprecates the tool in favor of
  `resend_webhook_event`. The MCP tool is still registered for callers
  that want the legacy in-place semantics; agents are now steered toward
  resend for the canonical "customer says they didn't get event X"
  workflow because retry overwrites the historical response on the source
  row.
- Server `instructions` updated to list
  `(list_webhook_events, get_webhook_event, resend_webhook_event)` as the
  primary audit/replay surface, with retry called out as the fallback for
  the legacy in-place behavior.
- Tool count: 32 → 33.
- Bumped `@garuhq/node` from `0.11.1` to `0.12.0` for the new
  `webhookEvents.resend()` method.

## [0.11.1] — 2026-05-19

### Fixed

- Bump `@garuhq/node` to `0.11.1` to pick up the empty-body POST fix.
  The `retry_webhook_event` and `resume_scheduled_charge` tools were
  failing against production with `Body cannot be empty when content-type
  is set to 'application/json'`. The SDK now sends an explicit `{}` body
  on every otherwise-empty mutation.

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
