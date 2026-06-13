import { describe, expect, it } from 'vitest'

import { generateRuntime, generateRuntimeInternal } from './generate-runtime.js'
import type { NormalizedOpenApi } from './openapi.js'

describe('generateRuntime', () => {
  const openapi: NormalizedOpenApi = {
    componentSchemas: {},
    endpoints: [
      {
        headerParameters: [],
        id: 'GET/repository/{id}',
        method: 'GET',
        path: '/repository/{id}',
        pathParameterNames: ['id'],
        pathParameters: [],
        queryParameters: [],
      },
      {
        headerParameters: [],
        id: 'POST/repository/version/create',
        method: 'POST',
        path: '/repository/version/create',
        pathParameterNames: [],
        pathParameters: [],
        queryParameters: [],
      },
    ],
  }

  it('generates an Axios singleton and delegates runtime internals', () => {
    const output = generateRuntime(openapi)
    const internalOutput = generateRuntimeInternal(openapi)

    expect(output).toContain('export const requestHttp: AxiosInstance = axios.create')
    expect(output).toContain("} from './request.internal'")
    expect(output).not.toContain('function parseRequestEndpoint')
    expect(output).not.toContain('function getPathParameterNames(path: string)')
    expect(output).not.toContain('function buildRequestUrl')
    expect(output).not.toContain('function mergeHeaders')
    expect(internalOutput).not.toContain('export const requestHttp')
    expect(internalOutput).not.toContain('const requestEndpoints')
    expect(internalOutput).toContain('export function parseRequestEndpoint(endpoint: string)')
    expect(internalOutput).toContain('function getPathParameterNames(path: string)')
    expect(internalOutput).toContain('export function buildRequestUrl(')
    expect(internalOutput).toContain('export function mergeHeaders(')
    expect(output).toContain('const meta = parseRequestEndpoint(endpoint)')
    expect(internalOutput).toContain('path.matchAll(/\\{([^}]+)\\}/g)')
    expect(internalOutput).toContain('path.matchAll(/(?:^|\\/):([A-Za-z0-9_]+)/g)')
    expect(output).toContain('AxiosResponse<IModels[K][\'Res\']>')
  })

  it('generates typed TanStack Query helpers', () => {
    const output = generateRuntime(openapi)

    expect(output).toContain('export function requestOptions<')
    expect(output).toContain('export function useRequestQuery<')
    expect(output).toContain('export function useRequestQueries<')
    expect(output).toContain('export function useRequestInfiniteQuery<')
    expect(output).toContain('export function useRequestMutation<')
    expect(output).toContain('mutationFn: (params) => requestApi(endpoint, params)')
  })

  it('uses path params for path substitution and keeps query cleanup separate', () => {
    const output = generateRuntimeInternal(openapi)
    const publicOutput = generateRuntime(openapi)

    expect(publicOutput).toContain("& RequestGroup<'path', IModels[K]['Path']>")
    expect(output).toContain('throw new Error(`Missing path parameter "${name}".`)')
    expect(output).toContain('const path = toUnknownRecord(getRequestPathSource(params))')
    expect(output).toContain("return 'path' in params ? params.path : undefined")
    expect(output).not.toContain('delete query[name]')
    expect(output).toContain('encodeURIComponent(String(value))')
    expect(output).toContain('.split(`{${name}}`).join(encodedValue)')
    expect(output).toContain('new RegExp(`(^|/):${escapeRegExp(name)}(?=/|$)`, \'g\')')
  })
})
