# request-codegen

Workspace-local TypeScript CLI for generating typed API model and request helper
files from OpenAPI 3 JSON.

The generator writes four files into a caller-selected output directory:

- `AGENT.md`: generated-directory guidance that tells AI agents to rerun the
  relevant `request-codegen` command instead of editing generated output.
- `models.ts`: endpoint model map and component schema type aliases.
- `request.ts`: Axios runtime, low-level request function, and TanStack Query
  helpers for public application imports.
- `request.internal.ts`: generated runtime helpers used by `request.ts`.

## Quick Start

Run generation from the repository root using the included test spec:

```bash
pnpm run generate:test
```

Or use the CLI directly:

```bash
pnpm run generate -- --input test/users.swagger.json --out test
```

Use `--filter` when running from a monorepo root or generating into another project:

```bash
pnpm --filter @vibefe/request-codegen run generate -- --input /absolute/path/openapi.json --out /absolute/path/generated-api
```

The CLI requires both arguments:

| Argument | Description |
| --- | --- |
| `--input <path>` | OpenAPI 3.x JSON file. YAML is not supported. |
| `--out <directory>` | Directory where `AGENT.md`, `models.ts`, `request.ts`, and `request.internal.ts` are written. |

## Commands

```bash
pnpm run generate -- --input test/users.swagger.json --out test
pnpm run typecheck
pnpm run test
pnpm run test:watch
pnpm run build
```

`build` emits the package CLI to `dist/cli.js` and exposes the `request-codegen`
bin declared in `package.json`.

## Generated Contract

`models.ts` exports component schemas and an `IModels` endpoint map keyed by
`METHOD/path` endpoint ids:

```ts
export interface IModels {
  'GET/repository/{id}': {
    Header: {
      'x-request-id'?: string
    }
    Query: {
      id: number
      versionId?: number
    }
    Body: {}
    Res: RepositoryInfoResponseDto
  }
}
```

Each endpoint has explicit `Header`, `Query`, `Body`, and `Res` groups. Path
parameters are supplied through `Query`, substituted into the URL, and removed
from the outgoing query string.

`request.ts` exports:

- `requestHttp`: shared Axios instance.
- `requestApi`: typed request function for every endpoint.
- `requestOptions`: typed TanStack Query options factory for GET endpoints.
- `useRequestQuery`: single GET query hook.
- `useRequestQueries`: typed batch query helper.
- `useRequestInfiniteQuery`: typed infinite query helper.
- `useRequestMutation`: mutation hook for non-GET endpoints.
- Supporting endpoint, parameter, query key, options, and result types.

The generated runtime imports `axios` and `@tanstack/react-query`; consuming
apps must provide those dependencies.
`request.internal.ts` contains generated implementation helpers and should not
be imported from application code.

## Runtime Usage

Configure Axios behavior from user-owned code by importing `requestHttp`.
Generated files should not be edited directly.

```ts
import { requestHttp } from './api/request'

requestHttp.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${readToken()}`
  return config
})
```

`requestHttp` reads `import.meta.env.VITE_API_BASE_URL` for its Axios `baseURL`.
When the variable is empty, Axios uses relative URLs.

Use `requestApi` for direct calls:

```ts
import { requestApi } from './api/request'

const repository = await requestApi('GET/repository/{id}', {
  query: {
    id: 1,
    versionId: 2,
  },
})
```

Use query helpers for React components:

```ts
import {
  useRequestMutation,
  useRequestQueries,
  useRequestQuery,
} from './api/request'

const repository = useRequestQuery(
  'GET/repository/{id}',
  { query: { id: 1 } },
  { staleTime: 5000 },
)

const [repositoryResult, accountCountResult] = useRequestQueries([
  {
    endpoint: 'GET/repository/{id}',
    params: { query: { id: 1 } },
  },
  {
    endpoint: 'GET/account/count',
    params: {},
  },
] as const)

const createVersion = useRequestMutation('POST/repository/version/create')
createVersion.mutate({
  body: {
    name: 'next',
    repositoryId: '1',
  },
})
```

Use `requestOptions` when passing generated query options to a QueryClient:

```ts
import { requestOptions } from './api/request'

await queryClient.ensureQueryData(
  requestOptions('GET/repository/{id}', { query: { id: 1 } }),
)
```

## Input Support

The generator supports the OpenAPI shapes needed by the current app:

- OpenAPI `3.x` JSON documents.
- `components.schemas` as exported TypeScript type aliases.
- Path-level and operation-level `parameters`.
- `header`, `query`, and `path` parameters.
- JSON request and response body schemas.
- Schema `$ref`, primitives, arrays, objects, enums, nullable schemas,
  `oneOf`, `anyOf`, `allOf`, and `additionalProperties`.
- URL path parameters in both `/path/{id}` and `/path/:id` forms.

For response schemas, the generator selects the first `2xx` response, then
`default`, then the first available response. Runtime request and response
validation is intentionally out of scope; generated types are compile-time
guidance only.

## Write Safety

The CLI creates missing output directories and overwrites files that contain the
generated marker near the top of the file. It refuses to overwrite hand-written
files:

```text
Refusing to overwrite non-generated file: <path>
```

Move or rename hand-written `AGENT.md`, `models.ts`, `request.ts`, or
`request.internal.ts` files before generating into the same directory.

## Project Structure

```text
src/cli.ts                Argument parsing and command orchestration
src/openapi.ts            OpenAPI normalization
src/schema-to-ts.ts       OpenAPI schema to TypeScript rendering
src/generate-models.ts    models.ts generator
src/generate-runtime.ts   request.ts and request.internal.ts generator
src/write-file.ts         Generated-file write safety
src/**/*.test.ts          Vitest coverage for the generator
src/__fixtures__/         Type inference fixtures
```
