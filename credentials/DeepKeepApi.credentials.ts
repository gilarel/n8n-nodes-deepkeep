import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * DeepKeep API credentials.
 *
 * Mirrors the Make.com connection:
 *  - Two fields: subDomain (plain text) + apiKey (secret, was "token" in Make).
 *  - Auth header: X-API-Key: <apiKey> on every request.
 *  - Connection test: GET https://api.<subDomain>.deepkeep.ai/health
 *    (note: outside the /api/ prefix, by design).
 */
export class DeepKeepApi implements ICredentialType {
  name = 'deepKeepApi';
  displayName = 'DeepKeep API';
  documentationUrl = 'https://docs.deepkeep.ai';

  properties: INodeProperties[] = [
    {
      displayName: 'Subdomain',
      name: 'subDomain',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'acme',
      description:
        'Enter the subdomain of your DeepKeep instance (https://api.&lt;subDomain&gt;.deepkeep.ai)',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Enter the API Key provided by DeepKeep',
    },
  ];

  /**
   * Injects X-API-Key into every outgoing request automatically.
   */
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
        'Content-Type': 'application/json',
      },
    },
  };

  /**
   * Powers the "Connect" / "Test" button in the credentials dialog.
   * Success = 2xx response; n8n surfaces any non-2xx status as an error.
   */
  test: ICredentialTestRequest = {
    request: {
      baseURL: '=https://api.{{$credentials.subDomain}}.deepkeep.ai',
      url: '/health',
      method: 'GET',
    },
  };
}
