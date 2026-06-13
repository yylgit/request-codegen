export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]
export type ParameterLocation = 'header' | 'path' | 'query'
export type UnknownRecord = Record<string, unknown>

export type NormalizedParameter = {
  description?: string
  in: ParameterLocation
  name: string
  required: boolean
  schema: UnknownRecord
}

export type NormalizedEndpoint = {
  bodySchema?: UnknownRecord
  description?: string
  headerParameters: NormalizedParameter[]
  id: string
  method: HttpMethod
  path: string
  pathParameterNames: string[]
  pathParameters: NormalizedParameter[]
  queryParameters: NormalizedParameter[]
  responseSchema?: UnknownRecord
  summary?: string
}

export type NormalizedOpenApi = {
  componentSchemas: Record<string, UnknownRecord>
  endpoints: NormalizedEndpoint[]
}

type OperationCandidate = {
  method: HttpMethod
  operation: UnknownRecord
}

export function normalizeOpenApi(value: unknown): NormalizedOpenApi {
  const document = asRecord(value, 'OpenAPI document must be an object.')
  const openapi = document.openapi

  if (typeof openapi !== 'string' || !openapi.startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x JSON documents are supported.')
  }

  const paths = asRecord(document.paths, 'OpenAPI document must include a paths object.')
  const componentSchemas = getComponentSchemas(document.components)
  const endpoints = Object.entries(paths)
    .flatMap(([path, pathItem]) => normalizePathItem(path, pathItem))
    .sort((left, right) => left.id.localeCompare(right.id))

  return {
    componentSchemas,
    endpoints,
  }
}

export function createEndpointId(method: HttpMethod, path: string) {
  return `${method}${path}`
}

function normalizePathItem(path: string, value: unknown): NormalizedEndpoint[] {
  const pathItem = asRecord(value, `Path item for ${path} must be an object.`)
  const pathLevelParameters = readParameters(pathItem.parameters)

  return getOperations(pathItem).map(({ method, operation }) => {
    const parameters = [...pathLevelParameters, ...readParameters(operation.parameters)]
    const headerParameters = parameters.filter((parameter) => parameter.in === 'header')
    const queryParameters = parameters.filter((parameter) => parameter.in === 'query')
    const pathParameters = parameters.filter((parameter) => parameter.in === 'path')

    return {
      bodySchema: readBodySchema(operation.requestBody),
      description: readOptionalString(operation.description),
      headerParameters,
      id: createEndpointId(method, path),
      method,
      path,
      pathParameterNames: getPathParameterNames(path),
      pathParameters,
      queryParameters,
      responseSchema: readResponseSchema(operation.responses),
      summary: readOptionalString(operation.summary),
    }
  })
}

function getOperations(pathItem: UnknownRecord): OperationCandidate[] {
  return Object.entries(pathItem).flatMap(([key, value]) => {
    const method = toHttpMethod(key)

    if (!method || !isRecord(value)) {
      return []
    }

    return [{ method, operation: value }]
  })
}

function toHttpMethod(value: string): HttpMethod | undefined {
  const upper = value.toUpperCase()

  return isHttpMethod(upper) ? upper : undefined
}

function isHttpMethod(value: string): value is HttpMethod {
  return HTTP_METHODS.includes(value as HttpMethod)
}

function readParameters(value: unknown): NormalizedParameter[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== 'string') {
      return []
    }

    const location = readParameterLocation(item.in)

    if (!location) {
      return []
    }

    return [
      {
        description: readOptionalString(item.description),
        in: location,
        name: item.name,
        required: item.required === true,
        schema: readSchema(item.schema),
      },
    ]
  })
}

function readParameterLocation(value: unknown): ParameterLocation | undefined {
  if (value === 'header' || value === 'path' || value === 'query') {
    return value
  }

  return undefined
}

function getPathParameterNames(path: string) {
  const names = new Set<string>()

  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    const [, name] = match

    if (name) {
      names.add(name)
    }
  }

  for (const match of path.matchAll(/(?:^|\/):([A-Za-z0-9_]+)/g)) {
    const [, name] = match

    if (name) {
      names.add(name)
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right))
}

function readBodySchema(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return readContentSchema(value.content)
}

function readResponseSchema(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const preferredStatus = Object.keys(value).find((status) => /^2\d\d$/.test(status))
    ?? Object.keys(value).find((status) => status === 'default')
    ?? Object.keys(value)[0]

  if (!preferredStatus) {
    return undefined
  }

  const response = value[preferredStatus]

  if (!isRecord(response)) {
    return undefined
  }

  return readContentSchema(response.content)
}

function readContentSchema(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const content = isRecord(value['application/json'])
    ? value['application/json']
    : Object.values(value).find(isRecord)

  if (!content || !isRecord(content.schema)) {
    return undefined
  }

  return content.schema
}

function readSchema(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function getComponentSchemas(value: unknown): Record<string, UnknownRecord> {
  if (!isRecord(value) || !isRecord(value.schemas)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value.schemas).flatMap(([name, schema]) => (
      isRecord(schema) ? [[name, schema]] : []
    )),
  )
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function asRecord(value: unknown, message: string): UnknownRecord {
  if (isRecord(value)) {
    return value
  }

  throw new Error(message)
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
