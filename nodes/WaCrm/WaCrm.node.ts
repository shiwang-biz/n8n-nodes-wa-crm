import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { apiRequest, apiRequestAll, clean, list } from './GenericFunctions';
import { contactFields, contactOperations } from './descriptions/ContactDescription';
import { conversationFields, conversationOperations } from './descriptions/ConversationDescription';
import { messageFields, messageOperations } from './descriptions/MessageDescription';
import {
	accountOperations,
	campaignFields,
	campaignOperations,
	templateFields,
	templateOperations,
} from './descriptions/OtherDescriptions';

export class WaCrm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp CRM',
		name: 'waCrm',
		icon: { light: 'file:../../icons/waCrm.svg', dark: 'file:../../icons/waCrm.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send WhatsApp messages, work the shared inbox and manage contacts in your WhatsApp CRM panel',
		defaults: { name: 'WhatsApp CRM' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'waCrmApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Campaign', value: 'campaign' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Message', value: 'message' },
					{ name: 'Template', value: 'template' },
				],
				default: 'message',
			},
			...messageOperations,
			...messageFields,
			...conversationOperations,
			...conversationFields,
			...contactOperations,
			...contactFields,
			...templateOperations,
			...templateFields,
			...campaignOperations,
			...campaignFields,
			...accountOperations,
		],
	};

	methods = {
		loadOptions: {
			async getAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const a = (await apiRequest.call(this, 'GET', '/account')) as {
					whatsappAccounts: Array<{ id: string; name: string; phoneNumbers: Array<{ displayPhoneNumber: string }> }>;
				};
				return a.whatsappAccounts.map((w) => ({
					name: `${w.name}${w.phoneNumbers[0] ? ` (${w.phoneNumbers[0].displayPhoneNumber})` : ''}`,
					value: w.id,
				}));
			},
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const r = (await apiRequest.call(this, 'GET', '/templates', undefined, { status: 'APPROVED' })) as {
					data: Array<{ name: string; language: string; category: string; variables?: { body?: number } }>;
				};
				return r.data
					.map((t) => ({
						name: `${t.name} (${t.language})`,
						value: `${t.name}|${t.language}`,
						description: `${t.category.toLowerCase()} · ${t.variables?.body ?? 0} variable${t.variables?.body === 1 ? '' : 's'}`,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
			async getTeam(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const r = (await apiRequest.call(this, 'GET', '/team')) as { data: Array<{ name: string; email: string; role: string; openConversations: number }> };
				return r.data.map((u) => ({ name: u.name, value: u.email, description: `${u.role} · ${u.openConversations} open` }));
			},
			async getTeamIds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const r = (await apiRequest.call(this, 'GET', '/team')) as { data: Array<{ id: string; name: string; role: string }> };
				return [{ name: 'Anyone', value: '' }, ...r.data.map((u) => ({ name: u.name, value: u.id, description: u.role }))];
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const push = (data: IDataObject | IDataObject[]) => {
					for (const json of Array.isArray(data) ? data : [data]) out.push({ json, pairedItem: { item: i } });
				};

				if (resource === 'message') {
					if (operation === 'get') {
						push(await apiRequest.call(this, 'GET', `/messages/${encodeURIComponent(this.getNodeParameter('messageId', i) as string)}`));
						continue;
					}
					if (operation === 'downloadMedia') {
						const id = this.getNodeParameter('messageId', i) as string;
						const field = this.getNodeParameter('outputBinary', i) as string;
						const res = (await apiRequest.call(this, 'GET', `/messages/${encodeURIComponent(id)}/media`, undefined, undefined, {
							encoding: 'arraybuffer',
							returnFullResponse: true,
							json: false,
						})) as { body: ArrayBuffer; headers: Record<string, string> };
						const name = /filename="?([^";]+)"?/.exec(res.headers['content-disposition'] ?? '')?.[1] ?? `media-${id}`;
						const binary = await this.helpers.prepareBinaryData(Buffer.from(res.body), name, res.headers['content-type']);
						out.push({ json: { messageId: id, fileName: name, mimeType: res.headers['content-type'] }, binary: { [field]: binary }, pairedItem: { item: i } });
						continue;
					}
					const to = this.getNodeParameter('to', i) as string;
					const options = this.getNodeParameter('options', i, {}) as IDataObject;
					const headers = options.idempotencyKey ? { 'Idempotency-Key': String(options.idempotencyKey) } : undefined;
					const base = clean({ to, accountId: options.accountId, replyTo: options.replyTo });
					const send = (path: string, body: IDataObject) => apiRequest.call(this, 'POST', path, body, undefined, headers ? { headers } : {});

					if (operation === 'sendTemplate') {
						const [name, language] = String(this.getNodeParameter('template', i)).split('|');
						const vars = ((this.getNodeParameter('bodyVariables', i, {}) as IDataObject).variable as IDataObject[] | undefined) ?? [];
						const t = this.getNodeParameter('templateOptions', i, {}) as IDataObject;
						const buttons: IDataObject = {};
						if (t.button0) buttons['0'] = t.button0;
						if (t.button1) buttons['1'] = t.button1;
						push(
							await send('/messages/template', {
								...clean({ to, accountId: options.accountId }),
								template: clean({ name, language }),
								params: clean({ body: vars.map((v) => String(v.value ?? '')), header: t.header, headerFilename: t.headerFilename, buttons: Object.keys(buttons).length ? buttons : undefined, code: t.code }),
							}),
						);
					} else if (operation === 'sendText') {
						push(await send('/messages/text', { ...base, text: this.getNodeParameter('text', i) as string }));
					} else if (operation === 'sendMedia') {
						const source = this.getNodeParameter('source', i) as string;
						const body: IDataObject = clean({ ...base, type: this.getNodeParameter('mediaType', i, '') as string, caption: options.caption, filename: options.filename, voice: options.voice || undefined });
						if (source === 'url') {
							body.url = this.getNodeParameter('url', i) as string;
						} else {
							const prop = this.getNodeParameter('binaryPropertyName', i) as string;
							const meta = this.helpers.assertBinaryData(i, prop);
							const buffer = await this.helpers.getBinaryDataBuffer(i, prop);
							const form = new FormData();
							const fileName = String(options.filename || meta.fileName || 'file');
							form.append('file', new Blob([new Uint8Array(buffer)], { type: meta.mimeType }), fileName);
							const up = (await apiRequest.call(this, 'POST', '/media', form)) as { fileId: string };
							body.fileId = up.fileId;
						}
						push(await send('/messages/media', body));
					} else if (operation === 'sendButtons') {
						const rows = ((this.getNodeParameter('buttons', i, {}) as IDataObject).button as IDataObject[] | undefined) ?? [];
						if (!rows.length) throw new NodeOperationError(this.getNode(), 'Add at least one button', { itemIndex: i });
						push(
							await send('/messages/interactive', {
								...base,
								...clean({ header: options.header, footer: options.footer }),
								body: this.getNodeParameter('body', i) as string,
								buttons: rows.map((b) => ({ id: String(b.id || b.title), title: String(b.title) })),
							}),
						);
					} else if (operation === 'sendList') {
						const rows = ((this.getNodeParameter('rows', i, {}) as IDataObject).row as IDataObject[] | undefined) ?? [];
						if (!rows.length) throw new NodeOperationError(this.getNode(), 'Add at least one row', { itemIndex: i });
						const sections = new Map<string, IDataObject[]>();
						for (const r of rows) {
							const key = String(r.section ?? '');
							sections.set(key, [...(sections.get(key) ?? []), clean({ id: String(r.id || r.title), title: String(r.title), description: r.description })]);
						}
						push(
							await send('/messages/interactive', {
								...base,
								...clean({ header: options.header, footer: options.footer }),
								body: this.getNodeParameter('body', i) as string,
								list: {
									button: this.getNodeParameter('listButton', i) as string,
									sections: [...sections].map(([title, sectionRows]) => ({ ...(title ? { title } : {}), rows: sectionRows })),
								},
							}),
						);
					}
					continue;
				}

				if (resource === 'conversation') {
					const id = () => encodeURIComponent(this.getNodeParameter('conversationId', i) as string);
					if (operation === 'getAll') {
						const f = this.getNodeParameter('filters', i, {}) as IDataObject;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						push(await apiRequestAll.call(this, '/conversations', clean({ status: f.status || 'ALL', assigned: f.assigned, assignedTo: f.assignedTo, q: f.q, accountId: f.accountId }), limit));
					} else if (operation === 'get') {
						push(await apiRequest.call(this, 'GET', `/conversations/${id()}`));
					} else if (operation === 'getMessages') {
						const r = (await apiRequest.call(this, 'GET', `/conversations/${id()}/messages`, undefined, { limit: this.getNodeParameter('limit', i) })) as { data: IDataObject[] };
						push(r.data);
					} else if (operation === 'assign') {
						const who = String(this.getNodeParameter('assignee', i)).trim();
						push(await apiRequest.call(this, 'POST', `/conversations/${id()}/assign`, who.includes('@') ? { email: who } : { userId: who }));
					} else if (operation === 'unassign') {
						push(await apiRequest.call(this, 'POST', `/conversations/${id()}/assign`, { userId: null }));
					} else if (operation === 'setStatus') {
						push(await apiRequest.call(this, 'POST', `/conversations/${id()}/status`, { status: this.getNodeParameter('status', i) as string }));
					} else if (operation === 'addNote') {
						push(await apiRequest.call(this, 'POST', `/conversations/${id()}/notes`, { text: this.getNodeParameter('note', i) as string }));
					}
					continue;
				}

				if (resource === 'contact') {
					if (operation === 'getAll') {
						const f = this.getNodeParameter('filters', i, {}) as IDataObject;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						push(await apiRequestAll.call(this, '/contacts', clean({ accountId: f.accountId, q: f.q, tag: f.tag, optedOut: f.optedOut }), limit, 200));
						continue;
					}
					const phone = this.getNodeParameter('phone', i) as string;
					const accountId = (this.getNodeParameter('options', i, {}) as IDataObject).accountId as string | undefined;
					if (operation === 'get') {
						push(await apiRequest.call(this, 'GET', `/contacts/${encodeURIComponent(phone)}`, undefined, clean({ accountId })));
						continue;
					}
					const body: IDataObject = clean({ phone, accountId });
					if (operation === 'upsert') {
						const f = this.getNodeParameter('fields', i, {}) as IDataObject;
						if (f.name !== undefined) body.name = f.name || null;
						if (f.email !== undefined) body.email = f.email || null;
						if (f.tags !== undefined) body.tags = list(f.tags);
						if (f.addTags) body.addTags = list(f.addTags);
						if (f.removeTags) body.removeTags = list(f.removeTags);
						if (f.optedOut !== undefined) body.optedOut = f.optedOut;
						const attrs = ((f.attributes as IDataObject | undefined)?.field as IDataObject[] | undefined) ?? [];
						if (attrs.length) body.attributes = Object.fromEntries(attrs.filter((a) => a.key).map((a) => [String(a.key), a.value === '' ? null : String(a.value)]));
					} else if (operation === 'addTags') {
						body.addTags = list(this.getNodeParameter('tags', i));
					} else if (operation === 'removeTags') {
						body.removeTags = list(this.getNodeParameter('tags', i));
					} else if (operation === 'optOut' || operation === 'optIn') {
						body.optedOut = operation === 'optOut';
					}
					push(await apiRequest.call(this, 'PUT', '/contacts', body));
					continue;
				}

				if (resource === 'template') {
					if (operation === 'getAll') {
						const f = this.getNodeParameter('filters', i, {}) as IDataObject;
						push(((await apiRequest.call(this, 'GET', '/templates', undefined, clean({ status: f.status, accountId: f.accountId }))) as { data: IDataObject[] }).data);
					} else {
						const o = this.getNodeParameter('options', i, {}) as IDataObject;
						push(await apiRequest.call(this, 'POST', '/templates/sync', clean({ accountId: o.accountId })));
					}
					continue;
				}

				if (resource === 'campaign') {
					if (operation === 'get') push(await apiRequest.call(this, 'GET', `/campaigns/${encodeURIComponent(this.getNodeParameter('campaignId', i) as string)}`));
					else push(((await apiRequest.call(this, 'GET', '/campaigns', undefined, { limit: this.getNodeParameter('limit', i) })) as { data: IDataObject[] }).data);
					continue;
				}

				if (resource === 'account') {
					if (operation === 'getTeam') push(((await apiRequest.call(this, 'GET', '/team')) as { data: IDataObject[] }).data);
					else push(await apiRequest.call(this, 'GET', '/account'));
					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unknown operation ${resource}.${operation}`, { itemIndex: i });
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				// Keep the panel's own message (e.g. "More than 24 hours have passed…") and its code.
				const e = error as NodeApiError;
				throw new NodeOperationError(this.getNode(), e.message, { itemIndex: i, description: e.description ?? undefined });
			}
		}
		return [out];
	}
}
