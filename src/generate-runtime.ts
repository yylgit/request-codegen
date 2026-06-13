import type { HttpMethod, NormalizedOpenApi } from './openapi.js'

export function generateRuntime(openapi: NormalizedOpenApi) {
  void openapi

  return `${renderGeneratedHeader()}

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import type {
  InfiniteData,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
} from '@tanstack/react-query'

import {
  buildRequestUrl,
  getRequestBody,
  getRequestHeader,
  getRequestQuery,
  mergeHeaders,
  parseRequestEndpoint,
  readRequestBaseUrl,
} from './request.internal'
import type { IModels } from './models'

export const requestHttp: AxiosInstance = axios.create({
  baseURL: readRequestBaseUrl(),
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RequestHeaders = Record<string, string | number | boolean | null | undefined>
type RequiredKeys<T> = {
  [Key in keyof T]-?: {} extends Pick<T, Key> ? never : Key
}[keyof T]
type RequestGroup<
  Key extends 'body' | 'header' | 'path' | 'query',
  Value,
> = keyof Value extends never
  ? { [Property in Key]?: Value }
  : RequiredKeys<Value> extends never
    ? { [Property in Key]?: Value }
    : { [Property in Key]: Value }

export type RequestEndpoint = keyof IModels
export type RequestQueryEndpoint = Extract<RequestEndpoint, \`GET\${string}\`>
export type RequestMutationEndpoint = Exclude<RequestEndpoint, RequestQueryEndpoint>
export type RequestParams<K extends RequestEndpoint> =
  & RequestGroup<'header', IModels[K]['Header']>
  & RequestGroup<'path', IModels[K]['Path']>
  & RequestGroup<'query', IModels[K]['Query']>
  & RequestGroup<'body', IModels[K]['Body']>
export type RequestConfig = Omit<
  AxiosRequestConfig,
  'data' | 'headers' | 'method' | 'params' | 'url'
> & {
  headers?: RequestHeaders
}
export type RequestQueryKey<K extends RequestQueryEndpoint> = readonly [
  'request',
  K,
  RequestParams<K>,
]
export type RequestInfiniteQueryKey<K extends RequestQueryEndpoint> = readonly [
  'request-infinite',
  K,
  RequestParams<K>,
]
export type RequestQueryItem<K extends RequestQueryEndpoint> = {
  endpoint: K
  params: RequestParams<K>
  options?: RequestQueryOptions<K>
}
export type RequestQueriesResult<
  TQueries extends readonly RequestQueryItem<RequestQueryEndpoint>[],
> = {
  [Index in keyof TQueries]: TQueries[Index] extends RequestQueryItem<infer K>
    ? UseQueryResult<IModels[K]['Res'], Error>
    : never
}
export type RequestQueryOptions<
  K extends RequestQueryEndpoint,
  TData = IModels[K]['Res'],
> = Omit<
  UseQueryOptions<IModels[K]['Res'], Error, TData, RequestQueryKey<K>>,
  'queryFn' | 'queryKey'
>
export type RequestMutationOptions<
  K extends RequestMutationEndpoint,
  TContext = unknown,
> = Omit<
  UseMutationOptions<IModels[K]['Res'], Error, RequestParams<K>, TContext>,
  'mutationFn'
>
export type RequestInfiniteParamsFactory<
  K extends RequestQueryEndpoint,
  TPageParam,
> = (
  pageParam: TPageParam,
  baseParams: RequestParams<K>,
) => RequestParams<K>
export type RequestInfiniteQueryOptions<
  K extends RequestQueryEndpoint,
  TPageParam,
  TData = InfiniteData<IModels[K]['Res']>,
> = Omit<
  UseInfiniteQueryOptions<
    IModels[K]['Res'],
    Error,
    TData,
    RequestInfiniteQueryKey<K>,
    TPageParam
  >,
  'queryFn' | 'queryKey'
>

export async function requestApi<K extends RequestEndpoint>(
  endpoint: K,
  params: RequestParams<K>,
  config?: RequestConfig,
): Promise<IModels[K]['Res']> {
  const meta = parseRequestEndpoint(endpoint)
  const response = await requestHttp.request<
    IModels[K]['Res'],
    AxiosResponse<IModels[K]['Res']>
  >({
    ...config,
    data: getRequestBody(params),
    headers: mergeHeaders(getRequestHeader(params), config?.headers),
    method: meta.method,
    params: getRequestQuery(params),
    url: buildRequestUrl(meta, params),
  })

  return response.data
}

export function requestOptions<
  K extends RequestQueryEndpoint,
  TData = IModels[K]['Res'],
>(
  endpoint: K,
  params: RequestParams<K>,
  options?: RequestQueryOptions<K, TData>,
): UseQueryOptions<IModels[K]['Res'], Error, TData, RequestQueryKey<K>> {
  return {
    ...options,
    queryKey: ['request', endpoint, params],
    queryFn: () => requestApi(endpoint, params),
  }
}

export function useRequestQuery<
  K extends RequestQueryEndpoint,
  TData = IModels[K]['Res'],
>(
  endpoint: K,
  params: RequestParams<K>,
  options?: RequestQueryOptions<K, TData>,
): UseQueryResult<TData, Error> {
  return useQuery(requestOptions(endpoint, params, options))
}

export function useRequestQueries<
  const TQueries extends readonly RequestQueryItem<RequestQueryEndpoint>[],
>(
  queries: TQueries,
): RequestQueriesResult<TQueries> {
  return useQueries({
    queries: queries.map((query) => requestOptions(
      query.endpoint,
      query.params,
      query.options,
    )),
  }) as RequestQueriesResult<TQueries>
}

export function useRequestInfiniteQuery<
  K extends RequestQueryEndpoint,
  TPageParam,
  TData = InfiniteData<IModels[K]['Res']>,
>(
  endpoint: K,
  baseParams: RequestParams<K>,
  getPageParams: RequestInfiniteParamsFactory<K, TPageParam>,
  options: RequestInfiniteQueryOptions<K, TPageParam, TData>,
): UseInfiniteQueryResult<TData, Error> {
  return useInfiniteQuery({
    ...options,
    queryKey: ['request-infinite', endpoint, baseParams],
    queryFn: ({ pageParam }) => requestApi(
      endpoint,
      getPageParams(pageParam as TPageParam, baseParams),
    ),
  })
}

export function useRequestMutation<
  K extends RequestMutationEndpoint,
  TContext = unknown,
>(
  endpoint: K,
  options?: RequestMutationOptions<K, TContext>,
): UseMutationResult<IModels[K]['Res'], Error, RequestParams<K>, TContext> {
  return useMutation({
    ...options,
    mutationFn: (params) => requestApi(endpoint, params),
  })
}
`
}

export function generateRuntimeInternal(openapi: NormalizedOpenApi) {
  void openapi

  return `${renderGeneratedHeader({ disableLint: false })}

type RequestMethod = ${renderMethodUnion()}
type RequestHeaders = Record<string, string | number | boolean | null | undefined>
type RequestEndpointMeta = {
  method: RequestMethod
  path: string
  pathParameterNames: readonly string[]
}
type RequestParamsShape = {
  body?: unknown
  header?: unknown
  path?: unknown
  query?: unknown
}

export function readRequestBaseUrl() {
  const meta = import.meta as ImportMeta & {
    env?: {
      VITE_API_BASE_URL?: string
    }
  }

  return meta.env?.VITE_API_BASE_URL?.trim() || undefined
}

export function parseRequestEndpoint(endpoint: string): RequestEndpointMeta {
  const match = /^([A-Z]+)(\\/.*)$/.exec(String(endpoint))
  const method = match?.[1]
  const path = match?.[2]

  if (!method || !path || !isRequestMethod(method)) {
    throw new Error(\`Invalid request endpoint "\${String(endpoint)}".\`)
  }

  return {
    method,
    path,
    pathParameterNames: getPathParameterNames(path),
  }
}

function isRequestMethod(value: string): value is RequestMethod {
  switch (value) {
    case 'GET':
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
    case 'HEAD':
    case 'OPTIONS':
      return true
    default:
      return false
  }
}

function getPathParameterNames(path: string) {
  const names = new Set<string>()

  for (const match of path.matchAll(/\\{([^}]+)\\}/g)) {
    const [, name] = match

    if (name) {
      names.add(name)
    }
  }

  for (const match of path.matchAll(/(?:^|\\/):([A-Za-z0-9_]+)/g)) {
    const [, name] = match

    if (name) {
      names.add(name)
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right))
}

export function buildRequestUrl(
  meta: RequestEndpointMeta,
  params: RequestParamsShape,
) {
  const path = toUnknownRecord(getRequestPathSource(params))

  return meta.pathParameterNames.reduce((url, name) => {
    const value = path[name]

    if (value === null || value === undefined) {
      throw new Error(\`Missing path parameter "\${name}".\`)
    }

    const encodedValue = encodeURIComponent(String(value))

    return url
      .split(\`{\${name}}\`).join(encodedValue)
      .replace(
        new RegExp(\`(^|/):\${escapeRegExp(name)}(?=/|$)\`, 'g'),
        (_match: string, prefix: string) => \`\${prefix}\${encodedValue}\`,
      )
  }, meta.path)
}

function escapeRegExp(value: string) {
  return value.replace(/[|\\\\{}()[\\]^$+*?.]/g, '\\\\$&')
}

export function getRequestQuery(
  params: RequestParamsShape,
) {
  const query = { ...toUnknownRecord(getRequestQuerySource(params)) }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      delete query[key]
    }
  }

  return Object.keys(query).length > 0 ? query : undefined
}

export function getRequestHeader(params: RequestParamsShape) {
  return 'header' in params ? params.header : undefined
}

function getRequestPathSource(params: RequestParamsShape) {
  return 'path' in params ? params.path : undefined
}

function getRequestQuerySource(params: RequestParamsShape) {
  return 'query' in params ? params.query : undefined
}

export function getRequestBody(params: RequestParamsShape) {
  return 'body' in params ? params.body : undefined
}

export function mergeHeaders(
  groupHeaders: unknown,
  configHeaders: RequestHeaders | undefined,
) {
  const headers = {
    ...toRequestHeaders(groupHeaders),
    ...configHeaders,
  }

  return Object.keys(headers).length > 0 ? headers : undefined
}

function toRequestHeaders(value: unknown): RequestHeaders {
  const headers: RequestHeaders = {}

  for (const [key, headerValue] of Object.entries(toUnknownRecord(value))) {
    if (
      headerValue === null
      || headerValue === undefined
      || typeof headerValue === 'boolean'
      || typeof headerValue === 'number'
      || typeof headerValue === 'string'
    ) {
      headers[key] = headerValue
    } else {
      headers[key] = String(headerValue)
    }
  }

  return headers
}

function toUnknownRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? { ...value }
    : {}
}
`
}

function renderGeneratedHeader(options: { disableLint?: boolean } = {}) {
  const marker = '/* This file is automatically generated by request-codegen. Do not modify. */'

  if (options.disableLint === false) {
    return marker
  }

  return `${marker}
/* eslint-disable */
/* tslint:disable */`
}

function renderMethodUnion() {
  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  return methods.map((method) => JSON.stringify(method)).join(' | ')
}
