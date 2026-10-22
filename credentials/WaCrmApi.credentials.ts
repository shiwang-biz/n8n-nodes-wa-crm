import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WaCrmApi implements ICredentialType {
	name = 'waCrmApi';

	displayName = 'WhatsApp CRM API';

	icon: Icon = { light: 'file:../icons/waCrm.svg', dark: 'file:../icons/waCrm.dark.svg' };

	documentationUrl = 'https://github.com/shiwang-biz/n8n-nodes-wa-crm#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Panel Address',
			name: 'panelUrl',
			type: 'string',
			default: '',
			placeholder: 'https://app.yourbrand.com',
			required: true,
			description:
				'The address you sign in to your WhatsApp panel at. Its API guide (Developers page) shows it too.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Create one in your panel under Developers → Create key. It starts with fs_live_.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.panelUrl.replace(/\\/+$/, "")}}/api/v1',
			url: '/account',
			method: 'GET',
		},
	};
}
