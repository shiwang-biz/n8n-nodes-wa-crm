import type { INodeProperties } from 'n8n-workflow';
import { accountOption, returnAllFields, show } from './shared';

const R = 'conversation';

export const conversationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show(R),
		options: [
			{ name: 'Add Note', value: 'addNote', description: 'Add an internal note (only your team sees it)', action: 'Add a note to a conversation' },
			{ name: 'Assign', value: 'assign', description: 'Give the chat to a team member', action: 'Assign a conversation' },
			{ name: 'Get', value: 'get', description: 'Get a conversation and its contact', action: 'Get a conversation' },
			{ name: 'Get Many', value: 'getAll', description: 'List conversations, newest first', action: 'Get many conversations' },
			{ name: 'Get Messages', value: 'getMessages', description: 'Messages, notes and events of a conversation', action: 'Get conversation messages' },
			{ name: 'Set Status', value: 'setStatus', description: 'Open, pending or resolved', action: 'Set conversation status' },
			{ name: 'Unassign', value: 'unassign', description: 'Put the chat back in the unassigned queue', action: 'Unassign a conversation' },
		],
		default: 'getAll',
	},
];

export const conversationFields: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		description: 'The conversationId from the trigger or from Get Many',
		displayOptions: show(R, ['get', 'getMessages', 'assign', 'unassign', 'setStatus', 'addNote']),
	},
	{
		displayName: 'Team Member Name or ID',
		name: 'assignee',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTeam' },
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		hint: 'Someone who can reply to customers. With an expression, give their sign-in email or user ID.',
		displayOptions: show(R, ['assign']),
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'Open', value: 'OPEN' },
			{ name: 'Pending (Waiting for Customer)', value: 'PENDING' },
			{ name: 'Resolved', value: 'RESOLVED' },
		],
		default: 'RESOLVED',
		displayOptions: show(R, ['setStatus']),
	},
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		displayOptions: show(R, ['addNote']),
	},
	...returnAllFields(R, ['getAll'], 500),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(R, ['getAll']),
		options: [
			accountOption,
			{
				displayName: 'Assigned',
				name: 'assigned',
				type: 'options',
				options: [
					{ name: 'Anyone or Nobody', value: 'all' },
					{ name: 'Unassigned Only', value: 'unassigned' },
				],
				default: 'all',
			},
			{
				displayName: 'Assigned To Name or ID',
				name: 'assignedTo',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTeamIds' },
				default: '',
				description: 'Only this team member\'s chats. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{ displayName: 'Search', name: 'q', type: 'string', default: '', description: 'Name or part of the number' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Any', value: 'ALL' },
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Pending', value: 'PENDING' },
					{ name: 'Resolved', value: 'RESOLVED' },
				],
				default: 'ALL',
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: show(R, ['getMessages']),
	},
];
