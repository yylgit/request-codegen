import { describe, expect, it } from 'vitest'

import { createEndpointId, normalizeOpenApi } from './openapi.js'

describe('createEndpointId', () => {
  it('uses upper-case method plus raw OpenAPI path', () => {
    expect(createEndpointId('GET', '/repository/{id}')).toBe('GET/repository/{id}')
  })
})

describe('normalizeOpenApi', () => {
  it('normalizes operations into deterministic endpoint models', () => {
    const result = normalizeOpenApi({
      openapi: '3.0.3',
      paths: {
        '/repository/{id}': {
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          get: {
            summary: 'Get repository',
            parameters: [
              {
                in: 'query',
                name: 'versionId',
                schema: { type: 'number' },
              },
              {
                in: 'header',
                name: 'x-request-id',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Repository' },
                  },
                },
              },
            },
          },
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
            responses: {
              '201': {
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Repository: {
            type: 'object',
          },
        },
      },
    })

    expect(result.componentSchemas).toEqual({
      Repository: {
        type: 'object',
      },
    })
    expect(result.endpoints).toHaveLength(2)
    expect(result.endpoints[0]).toMatchObject({
      headerParameters: [
        {
          in: 'header',
          name: 'x-request-id',
          required: true,
          schema: { type: 'string' },
        },
      ],
      id: 'GET/repository/{id}',
      method: 'GET',
      path: '/repository/{id}',
      pathParameterNames: ['id'],
      pathParameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
        },
      ],
      queryParameters: [
        {
          in: 'query',
          name: 'versionId',
          required: false,
          schema: { type: 'number' },
        },
      ],
      responseSchema: { $ref: '#/components/schemas/Repository' },
      summary: 'Get repository',
    })
    expect(result.endpoints[1]).toMatchObject({
      bodySchema: {
        properties: {
          name: { type: 'string' },
        },
        type: 'object',
      },
      id: 'POST/repository/{id}',
      method: 'POST',
      pathParameterNames: ['id'],
    })
  })

  it('parses path parameter names from brace and colon path segments', () => {
    const result = normalizeOpenApi({
      openapi: '3.0.3',
      paths: {
        '/app/mock/{repositoryId}/*': {
          get: {
            parameters: [
              {
                in: 'path',
                name: 'repositoryId',
                required: true,
                schema: { type: 'string' },
              },
              {
                in: 'path',
                name: '*',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {},
          },
        },
        '/teams/:teamId/repository/{id}': {
          get: {
            responses: {},
          },
        },
      },
    })

    expect(result.endpoints).toEqual([
      expect.objectContaining({
        id: 'GET/app/mock/{repositoryId}/*',
        pathParameterNames: ['repositoryId'],
      }),
      expect.objectContaining({
        id: 'GET/teams/:teamId/repository/{id}',
        pathParameterNames: ['id', 'teamId'],
      }),
    ])
  })

  it('rejects non OpenAPI 3 documents', () => {
    expect(() => normalizeOpenApi({ openapi: '2.0', paths: {} })).toThrow(
      'Only OpenAPI 3.x JSON documents are supported.',
    )
  })
})
