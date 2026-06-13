# Contributing

## Setup

```bash
pnpm install
```

## Quick Start

Run generation from the repository root using the included test spec:

```bash
pnpm run generate:test
```

Or use the CLI directly:

```bash
pnpm run generate -- --input test/users.swagger.json --out test
```

Use `--filter` when running from a monorepo root or generating into another
project:

```bash
pnpm --filter @vibefe/request-codegen run generate -- --input /absolute/path/openapi.json --out /absolute/path/generated-api
```

## Commands

| Command | Description |
| --- | --- |
| `pnpm run generate:test` | Run generator against the test OpenAPI spec |
| `pnpm run typecheck` | Type-check without emitting |
| `pnpm run test` | Run vitest once |
| `pnpm run test:watch` | Run vitest in watch mode |
| `pnpm run build` | Compile to `dist/cli.js` |
| `pnpm run test:app:install` | Install dependencies for the test React app |
| `pnpm run test:app:dev` | Start the test React app dev server |

`build` emits the package CLI to `dist/cli.js` and exposes the
`request-codegen` bin declared in `package.json`.

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

## Testing

Tests use [Vitest](https://vitest.dev/). Test files live alongside source files
in `src/` with the `.test.ts` extension:

- `src/cli.test.ts`
- `src/generate-models.test.ts`
- `src/generate-runtime.test.ts`
- `src/openapi.test.ts`
- `src/schema-to-ts.test.ts`
- `src/write-file.test.ts`

Type inference fixtures are in `src/__fixtures__/` and are checked by
`tsc` during `pnpm run typecheck`.

The test OpenAPI spec is at `test/users.swagger.json`. The test React app under
`test/react-app/` provides a real-world consumer to verify generated output
works end-to-end.

Run the full test suite:

```bash
pnpm run test
```

## Publishing

This project uses [Changesets](https://github.com/changesets/changesets) for
versioning and publishing:

```bash
pnpm run changeset         # Create a changeset for your changes
pnpm run version           # Update versions based on changesets
pnpm run publish:changeset # Publish to npm
```
