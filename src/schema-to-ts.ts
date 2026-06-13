import type { UnknownRecord } from './openapi.js'

export type TsProperty = {
  description?: string
  name: string
  required: boolean
  type: string
}

export function renderComponentSchemas(schemas: Record<string, UnknownRecord>) {
  return Object.entries(schemas)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, schema]) => `export type ${toTypeName(name)} = ${renderSchemaType(schema)}`)
    .join('\n\n')
}

export function renderSchemaType(schema: UnknownRecord | undefined): string {
  if (!schema) {
    return 'unknown'
  }

  const type = renderSchemaTypeInner(schema)

  return schema.nullable === true && type !== 'null' ? `${type} | null` : type
}

export function renderObjectType(properties: TsProperty[]) {
  if (properties.length === 0) {
    return '{}'
  }

  const lines = properties.flatMap((property) => {
    const propertyLine = `${renderPropertyName(property.name)}${property.required ? '' : '?'}: ${property.type}`

    if (!property.description) {
      return [`  ${propertyLine}`]
    }

    return [
      '  /**',
      `   * ${escapeComment(property.description)}`,
      '   */',
      `  ${propertyLine}`,
    ]
  })

  return `{\n${lines.join('\n')}\n}`
}

export function renderPropertyName(name: string) {
  return isIdentifier(name) ? name : JSON.stringify(name)
}

export function toTypeName(name: string) {
  const cleaned = name
    .replace(/^[^A-Za-z_$]+/, '')
    .replace(/[^A-Za-z0-9_$]+(.)?/g, (_match, next: string | undefined) => (
      next ? next.toUpperCase() : ''
    ))

  if (!cleaned) {
    return 'GeneratedType'
  }

  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `T${cleaned}`
}

function renderSchemaTypeInner(schema: UnknownRecord): string {
  const ref = readRef(schema)

  if (ref) {
    return ref
  }

  const union = renderUnion(schema.oneOf) ?? renderUnion(schema.anyOf)

  if (union) {
    return union
  }

  const intersection = renderIntersection(schema.allOf)

  if (intersection) {
    return intersection
  }

  const enumType = renderEnum(schema.enum)

  if (enumType) {
    return enumType
  }

  const schemaType = schema.type

  if (Array.isArray(schemaType)) {
    return schemaType.map(renderPrimitiveType).join(' | ')
  }

  switch (schemaType) {
    case 'array':
      return renderArray(schema.items)
    case 'boolean':
      return 'boolean'
    case 'integer':
    case 'number':
      return 'number'
    case 'object':
      return renderObjectSchema(schema)
    case 'string':
      return 'string'
    case 'null':
      return 'null'
    default:
      if (isRecord(schema.properties)) {
        return renderObjectSchema(schema)
      }

      return 'unknown'
  }
}

function renderArray(value: unknown) {
  return `${renderSchemaType(isRecord(value) ? value : undefined)}[]`
}

function renderObjectSchema(schema: UnknownRecord) {
  const properties = readObjectProperties(schema)
  const additional = schema.additionalProperties

  if (properties.length === 0) {
    if (isRecord(additional)) {
      return `Record<string, ${renderSchemaType(additional)}>`
    }

    if (additional === true) {
      return 'Record<string, unknown>'
    }

    return '{}'
  }

  const objectType = renderObjectType(properties)

  if (isRecord(additional)) {
    return `${objectType} & Record<string, ${renderSchemaType(additional)}>`
  }

  if (additional === true) {
    return `${objectType} & Record<string, unknown>`
  }

  return objectType
}

function readObjectProperties(schema: UnknownRecord): TsProperty[] {
  if (!isRecord(schema.properties)) {
    return []
  }

  const required = new Set(Array.isArray(schema.required)
    ? schema.required.filter((name): name is string => typeof name === 'string')
    : [])

  return Object.entries(schema.properties)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, propertySchema]) => ({
      description: isRecord(propertySchema) && typeof propertySchema.description === 'string'
        ? propertySchema.description
        : undefined,
      name,
      required: required.has(name),
      type: renderSchemaType(isRecord(propertySchema) ? propertySchema : undefined),
    }))
}

function readRef(schema: UnknownRecord) {
  if (typeof schema.$ref !== 'string') {
    return undefined
  }

  const name = schema.$ref.split('/').at(-1)

  return name ? toTypeName(name) : undefined
}

function renderUnion(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined
  }

  return value.map((item) => renderSchemaType(isRecord(item) ? item : undefined)).join(' | ')
}

function renderIntersection(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined
  }

  return value.map((item) => renderSchemaType(isRecord(item) ? item : undefined)).join(' & ')
}

function renderEnum(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined
  }

  return value.map((item) => {
    switch (typeof item) {
      case 'boolean':
        return item ? 'true' : 'false'
      case 'number':
        return String(item)
      case 'string':
        return JSON.stringify(item)
      default:
        return item === null ? 'null' : 'unknown'
    }
  }).join(' | ')
}

function renderPrimitiveType(value: unknown) {
  switch (value) {
    case 'boolean':
      return 'boolean'
    case 'integer':
    case 'number':
      return 'number'
    case 'null':
      return 'null'
    case 'string':
      return 'string'
    default:
      return 'unknown'
  }
}

function isIdentifier(value: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
}

function escapeComment(value: string) {
  return value.replace(/\*\//g, '*\\/')
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
