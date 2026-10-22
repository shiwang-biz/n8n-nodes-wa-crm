import type { INodeProperties } from 'n8n-workflow';
import { accountOption, show } from './shared';

export const templateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show('template'),
		options: [
			{ name: 'Get Many', value: 'getAll', description: 'Your templates with text, category, status and variable counts', action: 'Get many templates' },
			{ name: 'Sync', value: 'sync', description: 'Fetch the latest templates and approval status from WhatsApp', action: 'Sync templates' },
		],
		default: 'getAll',
	},
];

export const templateFields: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show('template', ['getAll']),
		options: [
			accountOption,
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Approved', value: 'APPROVED' },
					{ name: 'Pending', value: 'PENDING' },
					{ name: 'Rejected', value: 'REJECTED' },
				],
				default: '',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show('template', ['sync']),
		options: [accountOption],
	},
];

export const campaignOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show('campaign'),
		options: [
			{ name: 'Get', value: 'get', description: 'A campaign with its live counts', action: 'Get a campaign' },
			{ name: 'Get Many', value: 'getAll', description: 'Your campaigns, newest first', action: 'Get many campaigns' },
		],
		default: 'getAll',
	},
];

export const campaignFields: INodeProperties[] = [
	{
		displayName: 'Campaign ID',
		name: 'campaignId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show('campaign', ['get']),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 200 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: show('campaign', ['getAll']),
	},
];

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show('account'),
		options: [
			{ name: 'Get', value: 'get', description: 'Wallet balance and connected WhatsApp numbers', action: 'Get the account' },
			{ name: 'Get Team Members', value: 'getTeam', description: 'People who can reply to customers, with their open chats', action: 'Get team members' },
		],
		default: 'get',
	},
];
