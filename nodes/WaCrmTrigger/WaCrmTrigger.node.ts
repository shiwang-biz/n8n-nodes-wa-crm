import { createHmac, timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { apiRequest } from '../WaCrm/GenericFunctions';

const EVENTS = [
	{ name: 'Campaign Finished', value: 'campaign.completed', description: 'A campaign finished sending, with its final counts' },
	{ name: 'Contact Opted In', value: 'contact.opted_in', description: 'A contact replied START or was opted back in' },
	{ name: 'Contact Opted Out', value: 'contact.opted_out', description: 'A contact replied STOP or was opted out' },
	{ name: 'Conversation Assigned', value: 'conversation.assigned', description: 'A chat was given to someone, or unassigned' },
	{ name: 'Conversation Status Changed', value: 'conversation.status', description: 'A chat was opened, set to pending or resolved' },
	{ name: 'Message Received', value: 'message.received', description: 'A customer sent a message (text, button tap, photo, voice note…)' },
	{ name: 'Message Status Changed', value: 'message.status', description: 'A message you sent was sent, delivered, read or failed' },
];

/** Signatures older than this are refused (replays). */
const MAX_AGE_S = 300;

export class WaCrmTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp CRM Trigger',
		name: 'waCrmTrigger',
		icon: { light: 'file:../../icons/waCrm.svg', dark: 'file:../../icons/waCrm.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when customers message you, chats change or contacts opt out',
		defaults: { name: 'WhatsApp CRM Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'waCrmApi', required: true }],
		webhooks: [{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook' }],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: EVENTS,
				required: true,
				default: ['message.received'],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Only First Message of a Conversation',
						name: 'onlyNew',
						type: 'boolean',
						default: false,
						description: 'Whether Message Received should only fire for a customer\'s very first message (new leads)',
					},
					{
						displayName: 'Only WhatsApp Account ID',
						name: 'accountId',
						type: 'string',
						default: '',
						description: 'Ignore events from other WhatsApp accounts of the panel',
					},
					{
						displayName: 'Ignore Reactions',
						name: 'ignoreReactions',
						type: 'boolean',
						default: true,
						description: 'Whether to skip emoji reactions in Message Received',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				if (!data.webhookId) return false;
				const url = this.getNodeWebhookUrl('default');
				const events = [...(this.getNodeParameter('events') as string[])].sort().join(',');
				const r = (await apiRequest.call(this, 'GET', '/webhooks')) as { data: Array<{ id: string; url: string; events: string[] }> };
				const mine = r.data.find((w) => w.id === data.webhookId);
				if (mine && mine.url === url && [...mine.events].sort().join(',') === events) return true;
				// Gone, or the address/events changed: start again.
				if (mine) await apiRequest.call(this, 'DELETE', `/webhooks/${mine.id}`).catch(() => undefined);
				delete data.webhookId;
				delete data.secret;
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				const r = (await apiRequest.call(this, 'POST', '/webhooks', {
					url: this.getNodeWebhookUrl('default'),
					events: this.getNodeParameter('events') as string[],
					description: `n8n: ${this.getWorkflow().name ?? 'workflow'}`.slice(0, 200),
				})) as { id: string; secret: string };
				data.webhookId = r.id;
				data.secret = r.secret;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				if (data.webhookId) {
					try {
						await apiRequest.call(this, 'DELETE', `/webhooks/${data.webhookId}`);
					} catch (error) {
						// Already removed in the panel (or the key was revoked): nothing left to do.
						if (!/404|not found/i.test(String((error as Error).message))) return false;
					}
				}
				delete data.webhookId;
				delete data.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject() as ReturnType<IWebhookFunctions['getRequestObject']> & { rawBody?: Buffer };
		const res = this.getResponseObject();
		const secret = this.getWorkflowStaticData('node').secret as string | undefined;
		const body = this.getBodyData() as { id?: string; type?: string; createdAt?: string; data?: IDataObject };

		// Check it really came from the panel: HMAC-SHA256 of "<t>.<raw body>" with our secret.
		const header = String(this.getHeaderData()['x-webhook-signature'] ?? '');
		const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
		const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
		const expected = secret ? createHmac('sha256', secret).update(`${parts.t}.${raw}`).digest('hex') : '';
		const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < MAX_AGE_S;
		const valid = Boolean(secret && parts.v1 && fresh && expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)));
		if (!valid) {
			res.status(401).json({ error: 'Invalid signature' });
			return { noWebhookResponse: true };
		}

		const data = body.data ?? {};
		const options = this.getNodeParameter('options', {}) as IDataObject;
		const events = this.getNodeParameter('events') as string[];
		const skip =
			!body.type ||
			!events.includes(body.type) ||
			(options.accountId && data.accountId && data.accountId !== options.accountId) ||
			(body.type === 'message.received' && options.onlyNew && data.newConversation !== true) ||
			(body.type === 'message.received' && options.ignoreReactions !== false && data.type === 'reaction');
		if (skip) return { webhookResponse: { ok: true, skipped: true } };

		return {
			workflowData: [this.helpers.returnJsonArray([{ event: body.type, eventId: body.id, createdAt: body.createdAt, ...data }])],
		};
	}
}
