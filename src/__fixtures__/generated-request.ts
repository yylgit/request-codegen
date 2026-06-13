/* eslint-disable @typescript-eslint/no-empty-object-type */

import type {
  InfiniteData,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'

import type { IModels } from './generated-models.js'

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
export type RequestQueryEndpoint = Extract<RequestEndpoint, `GET${string}`>
export type RequestMutationEndpoint = Exclude<RequestEndpoint, RequestQueryEndpoint>
export type RequestParams<K extends RequestEndpoint> =
  & RequestGroup<'header', IModels[K]['Header']>
  & RequestGroup<'path', IModels[K]['Path']>
  & RequestGroup<'query', IModels[K]['Query']>
  & RequestGroup<'body', IModels[K]['Body']>
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

export declare function requestOptions<
  K extends RequestQueryEndpoint,
  TData = IModels[K]['Res'],
>(
  endpoint: K,
  params: RequestParams<K>,
  options?: RequestQueryOptions<K, TData>,
): UseQueryOptions<IModels[K]['Res'], Error, TData, RequestQueryKey<K>>

export declare function useRequestQuery<
  K extends RequestQueryEndpoint,
  TData = IModels[K]['Res'],
>(
  endpoint: K,
  params: RequestParams<K>,
  options?: RequestQueryOptions<K, TData>,
): UseQueryResult<TData, Error>

export declare function useRequestQueries<
  const TQueries extends readonly RequestQueryItem<RequestQueryEndpoint>[],
>(
  queries: TQueries,
): RequestQueriesResult<TQueries>

export declare function useRequestInfiniteQuery<
  K extends RequestQueryEndpoint,
  TPageParam,
  TData = InfiniteData<IModels[K]['Res']>,
>(
  endpoint: K,
  baseParams: RequestParams<K>,
  getPageParams: RequestInfiniteParamsFactory<K, TPageParam>,
  options: RequestInfiniteQueryOptions<K, TPageParam, TData>,
): UseInfiniteQueryResult<TData, Error>

export declare function useRequestMutation<
  K extends RequestMutationEndpoint,
  TContext = unknown,
>(
  endpoint: K,
  options?: RequestMutationOptions<K, TContext>,
): UseMutationResult<IModels[K]['Res'], Error, RequestParams<K>, TContext>
