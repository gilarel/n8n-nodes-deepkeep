import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import type {
  IDataObject,
  IHttpRequestMethods,
  NodeConnectionType,
} from 'n8n-workflow';

/**
 * DeepKeep n8n community node.
 *
 * Structure mirrors the Make.com app:
 *   Resource: "Firewall Conversation"
 *   Operations:
 *     - Check input          (POST /v2/firewalls/{firewallId}/conversation/{conversationId}/check_user_input)
 *     - Create conversation  (POST /v2/firewalls/{firewallId}/conversation)
 *     - Make API call        (arbitrary authorized request — user-provided path, method, headers, qs, body)
 *
 * Add new operations by extending the `operation` options list and the
 * switch block in execute().
 */
export class DeepKeep implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'DeepKeep',
    name: 'deepKeep',
    icon: 'file:deepkeep.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the DeepKeep AI Firewall API',
    defaults: {
      name: 'DeepKeep',
    },
    inputs: ['main' as NodeConnectionType],
    outputs: ['main' as NodeConnectionType],
    credentials: [
      {
        name: 'deepKeepApi',
        required: true,
      },
    ],
    properties: [
      // --- Resource selector ---
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Firewall Conversation',
            value: 'firewallConversation',
          },
        ],
        default: 'firewallConversation',
      },

      // --- Operation selector ---
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['firewallConversation'] },
        },
        options: [
          {
            name: 'Check input',
            value: 'checkInput',
            description: 'Check prompt against defined guardrails',
            action: 'Check prompt against defined guardrails',
          },
          {
            name: 'Create conversation',
            value: 'createConversation',
            description: 'Create a new conversation in a firewall',
            action: 'Create a new conversation in a firewall',
          },
          {
            name: 'Make API call',
            value: 'makeApiCall',
            description: 'Performs an arbitrary authorized API call',
            action: 'Perform an arbitrary authorized API call',
          },
        ],
        default: 'checkInput',
      },

      // --- Shared field: Firewall (used by Check input + Create conversation) ---
      {
        displayName: 'Firewall Name or ID',
        name: 'firewallId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'listFirewalls',
        },
        required: true,
        default: '',
        description:
          'The Firewall containing the guardrails. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['checkInput', 'createConversation'],
          },
        },
      },

      // --- Fields for "Check input" only ---
      {
        displayName: 'Conversation ID',
        name: 'conversationId',
        type: 'string',
        required: true,
        default: '',
        description: 'The ID of the Conversation',
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['checkInput'],
          },
        },
      },
      {
        displayName: 'Content',
        name: 'content',
        type: 'string',
        required: true,
        default: '',
        typeOptions: { rows: 4 },
        description: 'The text content to be checked by the firewall',
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['checkInput'],
          },
        },
      },
      {
        displayName: 'Return Full Response (Enable Logs)',
        name: 'logs',
        type: 'boolean',
        default: false,
        description:
          'When enabled, DeepKeep logs the request and returns <b>all</b> detected violations in the response. When disabled, the response may include only the primary violation. Enable this for audit, debugging, or when you need the complete violation list.',
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['checkInput'],
          },
        },
      },

      // --- Fields for "Make API call" only ---
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        required: true,
        default: '',
        placeholder: '/v2/firewalls',
        description:
          'Enter the part of the URL that comes after <code>deepkeep.ai/api</code>. For example, <code>/v2/firewalls</code>.',
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['makeApiCall'],
          },
        },
      },
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        required: true,
        default: 'GET',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['makeApiCall'],
          },
        },
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        placeholder: 'Add Header',
        description:
          "You don't have to add authorization headers; we already did that for you.",
        default: {
          parameter: [{ key: 'Content-Type', value: 'application/json' }],
        },
        options: [
          {
            name: 'parameter',
            displayName: 'Header',
            values: [
              {
                displayName: 'Key',
                name: 'key',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['makeApiCall'],
          },
        },
      },
      {
        displayName: 'Query String',
        name: 'queryParameters',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        placeholder: 'Add Parameter',
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Parameter',
            values: [
              {
                displayName: 'Key',
                name: 'key',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['makeApiCall'],
          },
        },
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        default: '',
        typeOptions: { rows: 5 },
        description:
          'Raw request body. Format it yourself (usually JSON). Leave empty for methods that don\'t need a body.',
        displayOptions: {
          show: {
            resource: ['firewallConversation'],
            operation: ['makeApiCall'],
          },
        },
      },
    ],
  };

  /**
   * Dynamic dropdown loaders. Each method's name matches the
   * `loadOptionsMethod` referenced in the properties above.
   *
   * Ports the Make.com RPC `listFirewalls`:
   *   POST /v2/firewalls/search?page=1&size=100
   *   body: { query: [] }
   *   response: body.data[] -> { label: name, value: id }
   */
  methods = {
    loadOptions: {
      async listFirewalls(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('deepKeepApi');
        const baseURL = `https://api.${credentials.subDomain}.deepkeep.ai/api`;

        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          'deepKeepApi',
          {
            method: 'POST',
            url: `${baseURL}/v2/firewalls/search`,
            qs: { page: 1, size: 100 },
            body: { query: [] },
            json: true,
          },
        );

        const items = (response?.data ?? []) as Array<{
          id: string;
          name: string;
        }>;

        return items.slice(0, 100).map((firewall) => ({
          name: firewall.name,
          value: firewall.id,
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = await this.getCredentials('deepKeepApi');
    const baseURL = `https://api.${credentials.subDomain}.deepkeep.ai/api`;

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        if (
          resource === 'firewallConversation' &&
          operation === 'checkInput'
        ) {
          const firewallId = this.getNodeParameter('firewallId', i) as string;
          const conversationId = this.getNodeParameter(
            'conversationId',
            i,
          ) as string;
          const content = this.getNodeParameter('content', i) as string;
          const logs = this.getNodeParameter('logs', i) as boolean;

          const response = await this.helpers.httpRequestWithAuthentication.call(
            this,
            'deepKeepApi',
            {
              method: 'POST',
              url: `${baseURL}/v2/firewalls/${encodeURIComponent(
                firewallId,
              )}/conversation/${encodeURIComponent(
                conversationId,
              )}/check_user_input`,
              body: { content, logs },
              json: true,
            },
          );

          // Make.com wrapped the response under `results`; preserve that shape.
          returnData.push({
            json: { results: response },
            pairedItem: { item: i },
          });
        } else if (
          resource === 'firewallConversation' &&
          operation === 'createConversation'
        ) {
          const firewallId = this.getNodeParameter('firewallId', i) as string;

          // DeepKeep's /conversation endpoint requires a JSON body even when
          // empty. Passing `body: {}` with `json: true` causes n8n/axios to
          // drop the body, which DeepKeep then sees as `null` and rejects with
          // 422 "Field required". Forcing a literal "{}" string with an
          // explicit Content-Type ensures the body reaches the server.
          const rawResponse = await this.helpers.httpRequestWithAuthentication.call(
            this,
            'deepKeepApi',
            {
              method: 'POST',
              url: `${baseURL}/v2/firewalls/${encodeURIComponent(
                firewallId,
              )}/conversation`,
              headers: {
                'Content-Type': 'application/json',
              },
              body: '{}',
              json: false,
            },
          );

          // With `json: false`, n8n returns the raw body. It may already be
          // parsed (if axios auto-parsed based on response Content-Type), or
          // still a JSON string — handle both.
          const response =
            typeof rawResponse === 'string'
              ? JSON.parse(rawResponse)
              : rawResponse;

          // Response is passed through as-is to mirror the Make.com module
          // ("output": "{{body}}" — no wrapping).
          returnData.push({
            json: response,
            pairedItem: { item: i },
          });
        } else if (
          resource === 'firewallConversation' &&
          operation === 'makeApiCall'
        ) {
          const userUrl = this.getNodeParameter('url', i) as string;
          const method = this.getNodeParameter(
            'method',
            i,
          ) as IHttpRequestMethods;
          const headersParam = this.getNodeParameter('headers', i, {}) as {
            parameter?: Array<{ key: string; value: string }>;
          };
          const queryParam = this.getNodeParameter(
            'queryParameters',
            i,
            {},
          ) as {
            parameter?: Array<{ key: string; value: string }>;
          };
          const bodyText = this.getNodeParameter('body', i, '') as string;

          // Normalize URL: strip leading slashes to avoid "/api//v2/...".
          const userPath = userUrl.replace(/^\/+/, '');
          const fullUrl = `${baseURL}/${userPath}`;

          // Flatten fixedCollection arrays into plain objects.
          const headers: Record<string, string> = {};
          for (const row of headersParam.parameter ?? []) {
            if (row.key) headers[row.key] = row.value;
          }
          const qs: Record<string, string> = {};
          for (const row of queryParam.parameter ?? []) {
            if (row.key) qs[row.key] = row.value;
          }

          // Build request. Use json:false so `body` is sent verbatim and the
          // body-dropping empty-object quirk can't bite us. Only attach a
          // body when the user actually provided one.
          const requestOptions: {
            method: IHttpRequestMethods;
            url: string;
            headers: Record<string, string>;
            qs: Record<string, string>;
            body?: string;
            returnFullResponse: boolean;
            json: boolean;
          } = {
            method,
            url: fullUrl,
            headers,
            qs,
            returnFullResponse: true,
            json: false,
          };

          if (bodyText && bodyText.length > 0) {
            requestOptions.body = bodyText;
          }

          const fullResponse =
            await this.helpers.httpRequestWithAuthentication.call(
              this,
              'deepKeepApi',
              requestOptions,
            );

          // Try to parse the response body as JSON for downstream convenience;
          // if the response isn't JSON (e.g., text/plain or HTML), pass through
          // as a string.
          let parsedBody: unknown = (fullResponse as { body: unknown }).body;
          if (typeof parsedBody === 'string' && parsedBody.length > 0) {
            try {
              parsedBody = JSON.parse(parsedBody);
            } catch {
              // Not JSON — leave as string.
            }
          }

          // Mirror Make.com's envelope: { statusCode, headers, body }.
          returnData.push({
            json: {
              statusCode: (fullResponse as { statusCode: number }).statusCode,
              headers: (fullResponse as {
                headers: Record<string, string>;
              }).headers,
              body: parsedBody as IDataObject | IDataObject[] | string,
            },
            pairedItem: { item: i },
          });
        } else {
          throw new NodeOperationError(
            this.getNode(),
            `Unsupported combination: resource="${resource}", operation="${operation}"`,
            { itemIndex: i },
          );
        }
      } catch (error) {
        // Friendly 429 mirroring the Make.com rate-limit message.
        const statusCode =
          (error as { httpCode?: number; response?: { status?: number } })
            ?.httpCode ??
          (error as { httpCode?: number; response?: { status?: number } })
            ?.response?.status;

        const friendlyError =
          statusCode === 429
            ? new NodeOperationError(
                this.getNode(),
                'Too many requests. Check if the rate limit is exceeded, or if the firewall is warming up.',
                { itemIndex: i },
              )
            : error;

        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (friendlyError as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }

        throw friendlyError;
      }
    }

    return [returnData];
  }
}
