import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type Ctx = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions;

/** https://panel.example.com/api/v1 from the credential (trailing slashes ignored). */
export async function apiBase(this: Ctx): Promise<string> {
	const creds = await this.getCredentials('waCrmApi');
	return `${String(creds.panelUrl).trim().replace(/\/+$/, '')}/api/v1`;
}

/** One call to the panel's API, with the key from the credential. Errors keep the API's message. */
export async function apiRequest(
	this: Ctx,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject | FormData,
	qs?: IDataObject,
	extra: Partial<IHttpRequestOptions> = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${await apiBase.call(this)}${path}`,
		json: !(body instanceof FormData) && extra.encoding !== 'arraybuffer',
		...(body !== undefined ? { body } : {}),
		...(qs ? { qs: clean(qs) } : {}),
		...extra,
	};
	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'waCrmApi', options);
	} catch (error) {
		const e = error as JsonObject & { response?: { data?: unknown } };
		const data = (e.response?.data ?? (e as { cause?: { response?: { data?: unknown } } }).cause?.response?.data) as
			| { error?: { code?: string; message?: string } }
			| undefined;
		const apiErr = data?.error;
		const err = new NodeApiError(this.getNode(), e, {
			message: apiErr?.message ?? (e.message as string | undefined),
			description: apiErr?.code ? `Error code: ${apiErr.code}` : undefined,
		});
		// n8n swaps 4xx messages for generic text; the panel's own words are more useful.
		if (apiErr?.message) {
			err.message = apiErr.message;
			err.description = apiErr.code ? `Error code: ${apiErr.code}` : null;
		}
		throw err;
	}
}

/** Follows nextCursor until done (or `limit` items). */
export async function apiRequestAll(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	path: string,
	qs: IDataObject = {},
	limit?: number,
	pageSize = 100,
): Promise<IDataObject[]> {
	const out: IDataObject[] = [];
	let cursor: string | undefined;
	do {
		const size = limit ? Math.min(pageSize, limit - out.length) : pageSize;
		const page = (await apiRequest.call(this, 'GET', path, undefined, { ...qs, limit: size, cursor })) as {
			data: IDataObject[];
			nextCursor?: string | null;
		};
		out.push(...page.data);
		cursor = page.nextCursor ?? undefined;
	} while (cursor && (!limit || out.length < limit));
	return limit ? out.slice(0, limit) : out;
}

/** Drop empty values so optional fields aren't sent. */
export function clean(o: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [k, v] of Object.entries(o)) {
		if (v === undefined || v === null || v === '') continue;
		if (Array.isArray(v) && v.length === 0) continue;
		out[k] = v;
	}
	return out;
}

/** "vip, delhi" → ["vip", "delhi"] */
export function list(v: unknown): string[] {
	if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
	return String(v ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
