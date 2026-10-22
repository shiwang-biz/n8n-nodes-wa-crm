import type { INodeProperties } from 'n8n-workflow';

/** Shown for one resource (and optionally some operations). */
export const show = (resource: string, operation?: string[]) => ({
	show: { resource: [resource], ...(operation ? { operation } : {}) },
});

export const phoneField = (resource: string, operation: string[], description = 'Customer number with country code, e.g. +919876543210. Numbers without one are treated as Indian.'): INodeProperties => ({
	displayName: 'To',
	name: 'to',
	type: 'string',
	required: true,
	default: '',
	placeholder: '+919876543210',
	description,
	displayOptions: show(resource, operation),
});

export const accountOption: INodeProperties = {
	displayName: 'WhatsApp Account Name or ID',
	name: 'accountId',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getAccounts' },
	default: '',
	description:
		'Only needed if your panel has more than one WhatsApp account. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
};

export const returnAllFields = (resource: string, operation: string[], max: number): INodeProperties[] => [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: show(resource, operation),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: max },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { resource: [resource], operation, returnAll: [false] } },
	},
];
