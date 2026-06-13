import {
  requestOptions,
  useRequestInfiniteQuery,
  useRequestMutation,
  useRequestQueries,
  useRequestQuery,
} from './generated-request.js'

const repositoryId = 1

const options = requestOptions(
  'GET/repository/{id}',
  { path: { id: repositoryId } },
  { staleTime: 5000 },
)
void options

const repository = useRequestQuery(
  'GET/repository/{id}',
  { path: { id: repositoryId } },
  { enabled: true },
)
const repositoryName: string | undefined = repository.data?.data.name
void repositoryName

const [repositoryResult, accountCountResult] = useRequestQueries([
  {
    endpoint: 'GET/repository/{id}',
    params: { path: { id: repositoryId } },
  },
  {
    endpoint: 'GET/account/count',
    params: {},
  },
] as const)
const accountCount: number | undefined = accountCountResult.data?.data
const resultName: string | undefined = repositoryResult.data?.data.name
void accountCount
void resultName

const infinite = useRequestInfiniteQuery(
  'GET/repository/version/list',
  { query: { limit: 20, repositoryId } },
  (page: number, params) => ({
    query: {
      ...params.query,
      start: page,
    },
  }),
  {
    getNextPageParam: (lastPage) => lastPage.data.nextStart,
    initialPageParam: 0,
  },
)
void infinite

const mutation = useRequestMutation('POST/repository/version/create')
mutation.mutate({
  body: {
    name: 'next',
    repositoryId: String(repositoryId),
  },
})

// @ts-expect-error missing required path.id
useRequestQuery('GET/repository/{id}', { path: {} })

// @ts-expect-error non-GET endpoints are not query endpoints
useRequestQuery('POST/repository/version/create', { body: { name: 'next', repositoryId: '1' } })

// @ts-expect-error GET endpoints are not mutation endpoints
useRequestMutation('GET/repository/{id}')

// @ts-expect-error missing required mutation body.name
mutation.mutate({ body: { repositoryId: '1' } })
