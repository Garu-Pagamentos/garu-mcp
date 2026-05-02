# Changelog

All notable changes to `@garuhq/mcp` are documented in this file. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

Older releases (≤ 0.4.0) are documented only in the corresponding git tag annotation.

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
