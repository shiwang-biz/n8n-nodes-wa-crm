# n8n-nodes-wa-crm

n8n nodes for **WhatsApp CRM panels**: send WhatsApp messages, work the shared inbox, manage contacts, and start workflows when customers write to you.

It works with any panel address, so it carries your provider's brand, not ours.

- **WhatsApp CRM** (action node). It is also usable as a tool by n8n AI agents.
- **WhatsApp CRM Trigger**. It subscribes itself when the workflow is turned on and unsubscribes when it is turned off, so there are no URLs to copy.

## Installation

In n8n open **Settings → Community nodes → Install** and enter `n8n-nodes-wa-crm`.

For more detail, see n8n's [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

You need your panel's address and an API key. API access must be included in your plan.

1. In your panel open **Developers → Create key**. Keys start with `fs_live_`.
2. In n8n create a **WhatsApp CRM API** credential:
   - **Panel Address**: the address you sign in at, e.g. `https://app.yourbrand.com`.
   - **API Key**: the key from step 1.

n8n checks the connection when you save.

## Operations

| Resource | Operations |
| --- | --- |
| Message | Send Template · Send Text · Send Media (from a link or binary data) · Send Buttons (up to 3) · Send List · Get · Download Media |
| Conversation | Get Many · Get · Get Messages · Assign · Unassign · Set Status · Add Note |
| Contact | Create or Update · Get · Get Many · Add Tags · Remove Tags · Opt Out · Opt In |
| Template | Get Many · Sync |
| Campaign | Get Many · Get |
| Account | Get · Get Team Members |

WhatsApp's rule applies to free-form messages (text, media, buttons, lists): you can only send them within **24 hours of the customer's last message**. Outside that window, send an approved **template**. Every message costs the same as it does from the panel.

Set an **Idempotency Key** on a send (for example, your order ID). If n8n retries the send, the message still goes out only once.

## Trigger events

| Event | When |
| --- | --- |
| Message Received | A customer sent a message: text, a button or list reply, a photo, a voice note, and so on. `newConversation` is true for their very first message. |
| Message Status Changed | A message you sent was sent, delivered, read or failed. |
| Conversation Assigned | A chat was assigned to someone, or unassigned. |
| Conversation Status Changed | A chat was opened, set to pending or resolved, including when a customer reopens it by writing. |
| Contact Opted Out / Opted In | The customer replied STOP / START, or was opted out or in by your team or the API. |
| Campaign Finished | A campaign finished sending, with its final counts. |

The trigger has three options:

- **Only First Message of a Conversation**: start the workflow only for new leads.
- **Only WhatsApp Account ID**: ignore events from the panel's other WhatsApp accounts.
- **Ignore Reactions**: skip emoji reactions.

Every event is signed. The trigger rejects any request whose signature doesn't check out.

### Requirements

The panel must be able to reach n8n over the internet. n8n Cloud works. A self-hosted n8n needs a public https address (set `WEBHOOK_URL`). An n8n that is only reachable on `localhost` cannot receive events.

## Examples

- **Auto-reply with a menu**: Trigger (Message Received, only first message) → WhatsApp CRM *Send Buttons* ("Order", "Track", "Talk to us").
- **Leads into your CRM**: Trigger (Message Received, only first message) → your CRM node → WhatsApp CRM *Add Note* ("Lead created").
- **Order updates**: Shopify / WooCommerce trigger → WhatsApp CRM *Send Template* with an Idempotency Key set to the order ID.
- **Hand-off**: Trigger (Message Received) → IF text contains "agent" → WhatsApp CRM *Assign* to a team member.

## Compatibility

Tested with n8n 2.44.

## Development

```bash
npm ci --ignore-scripts
npm run lint
npm run build
npm run dev   # starts n8n with these nodes loaded
```

Releases are published to npm from GitHub Actions with provenance. See `.github/workflows/publish.yml`.

## License

[MIT](LICENSE)
