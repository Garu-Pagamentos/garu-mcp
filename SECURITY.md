# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | Yes                |
| < 0.2   | No                 |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email **security@garu.com.br** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge your report within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Considerations

### PCI-DSS and Card Data

This MCP server intentionally does **not** support credit card charges. Raw card numbers, CVVs, and expiry dates must never flow through an AI agent or LLM context. If you need to accept credit card payments, use Garu's hosted checkout or a PCI-compliant tokenization flow directly in your frontend.

### API Key Protection

The `GARU_API_KEY` environment variable grants full access to your Garu seller account. Keep it secret:

- Never commit it to version control
- Never pass it as a CLI argument (visible in process lists)
- Use a secrets manager in production environments

### Base URL Override

The `GARU_BASE_URL` environment variable redirects all API calls to an arbitrary server. This is intended for development only. In shared or production environments, ensure this variable is not set, as it could be used to intercept customer PII and payment data.

### Rate Limiting

This MCP server does not implement rate limiting. Rate limiting is enforced by the Garu API backend. If you expose this server to untrusted clients, consider adding application-level rate limiting in your MCP host.

### Branch Protection (Maintainers)

Maintainers should enable the following GitHub settings:

- Require pull request reviews before merging to `main`
- Require status checks to pass before merging
- Restrict who can push tags (to prevent unauthorized releases)

### Release Publishing (Maintainers)

The release workflow uses npm Trusted Publishing (OIDC) with a GitHub Environment named `npm`. Both sides must be configured for releases to succeed:

1. **GitHub**: Create an Environment called `npm` in Settings > Environments. Optionally add a manual approval step for release protection.
2. **npm**: Under the `@garuhq/mcp` package settings, add a Trusted Publisher entry pointing to `Garu-Pagamentos/garu-mcp`, workflow `release.yml`, and environment `npm`.

Without both configurations, `npm publish --provenance` will fail with a 403. Forks must set up their own OIDC trust relationship.
