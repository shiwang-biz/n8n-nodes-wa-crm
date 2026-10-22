import type { INodeProperties } from 'n8n-workflow';
import { accountOption, phoneField, show } from './shared';

const R = 'message';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: show(R),
		options: [
			{ name: 'Download Media', value: 'downloadMedia', description: 'Download the photo, video, voice note or document of a message', action: 'Download message media' },
			{ name: 'Get', value: 'get', description: 'Get a message and its delivery status', action: 'Get a message' },
			{ name: 'Send Buttons', value: 'sendButtons', description: 'Send up to 3 reply buttons (within 24 hours of the customer\'s last message)', action: 'Send reply buttons' },
			{ name: 'Send List', value: 'sendList', description: 'Send a list menu (within 24 hours of the customer\'s last message)', action: 'Send a list menu' },
			{ name: 'Send Media', value: 'sendMedia', description: 'Send a photo, video, audio or document (within 24 hours of the customer\'s last message)', action: 'Send media' },
			{ name: 'Send Template', value: 'sendTemplate', description: 'Send an approved template — works any time', action: 'Send a template' },
			{ name: 'Send Text', value: 'sendText', description: 'Send free-form text (within 24 hours of the customer\'s last message)', action: 'Send text' },
		],
		default: 'sendTemplate',
	},
];

const SENDS = ['sendTemplate', 'sendText', 'sendMedia', 'sendButtons', 'sendList'];

export const messageFields: INodeProperties[] = [
	phoneField(R, SENDS),

	// ── template ──
	{
		displayName: 'Template Name or ID',
		name: 'template',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		required: true,
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		hint: 'An approved template. With an expression, give "name" or "name|language".',
		displayOptions: show(R, ['sendTemplate']),
	},
	{
		displayName: 'Body Variables',
		name: 'bodyVariables',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Variable',
		default: {},
		description: 'Values for {{1}}, {{2}}… in the template text, in order',
		displayOptions: show(R, ['sendTemplate']),
		options: [{ displayName: 'Variable', name: 'variable', values: [{ displayName: 'Value', name: 'value', type: 'string', default: '' }] }],
	},
	{
		displayName: 'Template Options',
		name: 'templateOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(R, ['sendTemplate']),
		options: [
			{ displayName: 'Code', name: 'code', type: 'string', default: '', description: 'One-time password (authentication templates) or offer code (copy-code button)' },
			{ displayName: 'Header File Name', name: 'headerFilename', type: 'string', default: '', description: 'Document headers: the file name the customer sees' },
			{ displayName: 'Header Value', name: 'header', type: 'string', default: '', description: 'Text for a {{1}} text header, or a public https link for an image, video or document header' },
			{ displayName: 'Link Button Value', name: 'button0', type: 'string', default: '', description: 'For a website button ending in {{1}} (the first button)' },
			{ displayName: 'Second Link Button Value', name: 'button1', type: 'string', default: '', description: 'For a second website button ending in {{1}}' },
		],
	},

	// ── text ──
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: show(R, ['sendText']),
	},

	// ── media ──
	{
		displayName: 'File From',
		name: 'source',
		type: 'options',
		options: [
			{ name: 'Link (URL)', value: 'url', description: 'A public https link to the file' },
			{ name: 'Binary Data', value: 'binary', description: 'A file from a previous node' },
		],
		default: 'url',
		displayOptions: show(R, ['sendMedia']),
	},
	{
		displayName: 'File URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/invoice.pdf',
		description: 'Up to 16 MB. Photos: JPG/PNG; video: MP4; audio: OGG/MP3; documents: PDF, Word, Excel, PowerPoint.',
		displayOptions: { show: { resource: [R], operation: ['sendMedia'], source: ['url'] } },
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		hint: 'The name of the input binary field containing the file',
		displayOptions: { show: { resource: [R], operation: ['sendMedia'], source: ['binary'] } },
	},
	{
		displayName: 'Send As',
		name: 'mediaType',
		type: 'options',
		options: [
			{ name: 'Audio', value: 'audio' },
			{ name: 'Automatic (From the File)', value: '' },
			{ name: 'Document', value: 'document' },
			{ name: 'Image', value: 'image' },
			{ name: 'Video', value: 'video' },
		],
		default: '',
		description: 'Send a PDF or photo as a document to keep its file name',
		displayOptions: show(R, ['sendMedia']),
	},

	// ── buttons / list ──
	{
		displayName: 'Message',
		name: 'body',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		displayOptions: show(R, ['sendButtons', 'sendList']),
	},
	{
		displayName: 'Buttons',
		name: 'buttons',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Button',
		default: {},
		description: 'Up to 3. When tapped, the WhatsApp CRM Trigger receives the button ID.',
		displayOptions: show(R, ['sendButtons']),
		options: [
			{
				displayName: 'Button',
				name: 'button',
				values: [
					{ displayName: 'Title', name: 'title', type: 'string', default: '', description: 'Up to 20 characters' },
					{ displayName: 'ID', name: 'id', type: 'string', default: '', description: 'What you get back when it is tapped (defaults to the title)' },
				],
			},
		],
	},
	{
		displayName: 'Menu Button Text',
		name: 'listButton',
		type: 'string',
		required: true,
		default: 'Choose',
		description: 'The button that opens the list (up to 20 characters)',
		displayOptions: show(R, ['sendList']),
	},
	{
		displayName: 'Rows',
		name: 'rows',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Row',
		default: {},
		description: 'Up to 10 in total. Rows with the same section name are grouped under it.',
		displayOptions: show(R, ['sendList']),
		options: [
			{
				displayName: 'Row',
				name: 'row',
				values: [
					{ displayName: 'Title', name: 'title', type: 'string', default: '', description: 'Up to 24 characters' },
					{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Optional, up to 72 characters' },
					{ displayName: 'ID', name: 'id', type: 'string', default: '', description: 'What you get back when it is chosen (defaults to the title)' },
					{ displayName: 'Section', name: 'section', type: 'string', default: '', description: 'Optional section name (up to 24 characters)' },
				],
			},
		],
	},

	// ── options for every send ──
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(R, SENDS),
		options: [
			accountOption,
			{ displayName: 'Caption', name: 'caption', type: 'string', default: '', displayOptions: { show: { '/operation': ['sendMedia'] } } },
			{ displayName: 'File Name', name: 'filename', type: 'string', default: '', description: 'For documents: the name the customer sees', displayOptions: { show: { '/operation': ['sendMedia'] } } },
			{ displayName: 'Footer', name: 'footer', type: 'string', default: '', description: 'Small grey text under the message (up to 60 characters)', displayOptions: { show: { '/operation': ['sendButtons', 'sendList'] } } },
			{ displayName: 'Header', name: 'header', type: 'string', default: '', description: 'Bold line above the message (up to 60 characters)', displayOptions: { show: { '/operation': ['sendButtons', 'sendList'] } } },
			{ displayName: 'Idempotency Key', name: 'idempotencyKey', type: 'string', default: '', description: 'A unique value (e.g. your order ID). Retrying with the same key never sends twice.' },
			{ displayName: 'Reply To Message ID', name: 'replyTo', type: 'string', default: '', description: 'Quote a customer message (its messageId from the trigger)', displayOptions: { show: { '/operation': ['sendText', 'sendMedia', 'sendButtons', 'sendList'] } } },
			{ displayName: 'Voice Note', name: 'voice', type: 'boolean', default: false, description: 'Whether to send an OGG audio file as a voice note', displayOptions: { show: { '/operation': ['sendMedia'] } } },
		],
	},

	// ── get / download ──
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		description: 'The messageId from the trigger, or the ID returned when you sent it',
		displayOptions: show(R, ['get', 'downloadMedia']),
	},
	{
		displayName: 'Put Output File in Field',
		name: 'outputBinary',
		type: 'string',
		required: true,
		default: 'data',
		hint: 'The name of the output binary field to put the file in',
		displayOptions: show(R, ['downloadMedia']),
	},
];
