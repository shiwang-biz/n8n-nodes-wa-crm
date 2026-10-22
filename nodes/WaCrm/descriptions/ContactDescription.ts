import type { INodeProperties } from 'n8n-workflow';
import { accountOption, returnAllFields, show } from './shared';

const R = 'contact';

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show(R),
		options: [
			{ name: 'Add Tags', value: 'addTags', description: 'Add tags to a contact (created if new)', action: 'Add tags to a contact' },
			{ name: 'Create or Update', value: 'upsert', description: 'Create a new record, or update the current one if it already exists (upsert)', action: 'Create or update a contact' },
			{ name: 'Get', value: 'get', description: 'Get a contact by phone number', action: 'Get a contact' },
			{ name: 'Get Many', value: 'getAll', description: 'List contacts, newest first', action: 'Get many contacts' },
			{ name: 'Opt In', value: 'optIn', description: 'Allow marketing messages again', action: 'Opt in a contact' },
			{ name: 'Opt Out', value: 'optOut', description: 'Stop marketing messages to this contact', action: 'Opt out a contact' },
			{ name: 'Remove Tags', value: 'removeTags', description: 'Take tags off a contact', action: 'Remove tags from a contact' },
		],
		default: 'upsert',
	},
];

const ONE = ['upsert', 'get', 'addTags', 'removeTags', 'optIn', 'optOut'];

export const contactFields: INodeProperties[] = [
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		required: true,
		default: '',
		placeholder: '+919876543210',
		description: 'With country code. Numbers without one are treated as Indian.',
		displayOptions: show(R, ONE),
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lead, website',
		description: 'Comma-separated',
		displayOptions: show(R, ['addTags', 'removeTags']),
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(R, ['upsert']),
		options: [
			{ displayName: 'Add Tags', name: 'addTags', type: 'string', default: '', description: 'Comma-separated; kept with the existing tags' },
			{
				displayName: 'Custom Fields',
				name: 'attributes',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Merged into the contact\'s custom fields (keys: lowercase letters, digits, _). An empty value removes the field.',
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{ displayName: 'Key', name: 'key', type: 'string', default: '', placeholder: 'city' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
			{ displayName: 'Opted Out', name: 'optedOut', type: 'boolean', default: false, description: 'Whether the contact is opted out of marketing messages' },
			{ displayName: 'Remove Tags', name: 'removeTags', type: 'string', default: '', description: 'Comma-separated' },
			{ displayName: 'Replace Tags With', name: 'tags', type: 'string', default: '', description: 'Comma-separated; replaces all existing tags' },
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(R, ONE),
		options: [accountOption],
	},
	...returnAllFields(R, ['getAll'], 5000),
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
				displayName: 'Opted Out',
				name: 'optedOut',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Opted Out Only', value: 'true' },
					{ name: 'Not Opted Out', value: 'false' },
				],
				default: '',
			},
			{ displayName: 'Search', name: 'q', type: 'string', default: '', description: 'Name, email or part of the number' },
			{ displayName: 'Tag', name: 'tag', type: 'string', default: '' },
		],
	},
];
