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

export const chatbotOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show('chatbot'),
		options: [
			{ name: 'Get Many', value: 'getAll', description: 'Your published chatbots', action: 'Get many chatbots' },
			{
				name: 'Start',
				value: 'start',
				description: 'Start a chatbot in a customer’s chat (stops any bot running there)',
				action: 'Start a chatbot',
			},
		],
		default: 'start',
	},
];

export const chatbotFields: INodeProperties[] = [
	{
		displayName: 'Chatbot Name or ID',
		name: 'botId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getBots' },
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: show('chatbot', ['start']),
	},
	{
		displayName: 'Find Chat By',
		name: 'target',
		type: 'options',
		options: [
			{ name: 'Phone Number', value: 'phone' },
			{ name: 'Conversation ID', value: 'conversationId' },
		],
		default: 'phone',
		displayOptions: show('chatbot', ['start']),
	},
	{
		displayName: 'Phone Number',
		name: 'phone',
		type: 'string',
		required: true,
		default: '',
		placeholder: '+919876543210',
		description: 'With the country code. The customer must have chatted with you before (send a template first if not).',
		displayOptions: { show: { resource: ['chatbot'], operation: ['start'], target: ['phone'] } },
	},
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['chatbot'], operation: ['start'], target: ['conversationId'] } },
	},
	{
		displayName: 'Values',
		name: 'values',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Value',
		default: {},
		description: 'Values the bot can use as {{name}} in its messages, e.g. invoice = INV-9',
		displayOptions: show('chatbot', ['start']),
		options: [
			{
				name: 'value',
				displayName: 'Value',
				values: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '', placeholder: 'invoice', description: 'Lowercase letters, numbers and _' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show('chatbot', ['start']),
		options: [accountOption],
	},
];
