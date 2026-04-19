# n8n-nodes-deepkeep

An [n8n](https://n8n.io) community node for the [DeepKeep](https://deepkeep.ai) AI Firewall API.

Use it in your workflows to check LLM inputs and outputs against DeepKeep guardrails, create firewall conversations, and make arbitrary authorized calls to any DeepKeep API endpoint.

## Installation

### Via the n8n UI (self-hosted or Cloud once verified)

In your n8n instance, go to **Settings → Community Nodes → Install**, paste `n8n-nodes-deepkeep`, and click **Install**.

### Manually (self-hosted)

From your n8n root directory:

```bash
npm install n8n-nodes-deepkeep
```

Make sure `N8N_COMMUNITY_PACKAGES_ENABLED=true` (default in recent versions), then restart n8n.

## Credentials

Create a **DeepKeep API** credential with:

| Field       | Value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Subdomain   | Your DeepKeep environment subdomain (e.g. `acme`). The base URL becomes `https://api.<subdomain>.deepkeep.ai`. |
| API Key     | Your DeepKeep API key. Sent as the `X-API-Key` header on every request. |

The credential is tested against `GET /health`.

## Operations

All operations live under the **Firewall Conversation** resource.

### Check input

Checks a prompt against the guardrails defined on a firewall.

- **Firewall** — select from the list of firewalls in your DeepKeep workspace (populated dynamically).
- **Conversation ID** — existing conversation to append the check to.
- **Content** — the text to check.
- **Return Full Response (Enable Logs)** — when `false`, the API returns only the first violation; when `true`, it returns all violations. Default: `true`.

Returns the wrapped response `{ results: ... }` to mirror the Make.com module.

### Create conversation

Starts a new conversation on a firewall. Returns the raw response from the API (including the new conversation ID).

- **Firewall** — select from the list.

### Make API call

An escape hatch that lets you call any DeepKeep endpoint with the configured credentials.

- **URL** — path relative to the API base (e.g. `v2/firewalls/search`).
- **Method** — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- **Headers** — optional key/value rows. `Content-Type: application/json` is included by default.
- **Query Parameters** — optional key/value rows.
- **Body** — raw request body (usually JSON).

Returns `{ statusCode, headers, body }`. `body` is parsed as JSON when possible, otherwise passed through as a string. Non-2xx responses are returned in the envelope rather than thrown.

## Local development

See the sibling `n8n-deepkeep/` folder in the source repository for a Docker Compose setup that runs n8n locally with this package mounted as a custom node.

## License

[MIT](./LICENSE)

## Support

- DeepKeep documentation: https://deepkeep.ai
- Issues: please file on this repository
- Contact: support@deepkeep.ai
