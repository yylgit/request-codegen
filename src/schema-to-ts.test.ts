import { describe, expect, it } from 'vitest'

import {
  renderComponentSchemas,
  renderObjectType,
  renderPropertyName,
  renderSchemaType,
  toTypeName,
} from './schema-to-ts.js'

describe('renderSchemaType', () => {
  it('renders refs, primitives, arrays, enums, and nullable schemas', () => {
    expect(renderSchemaType({ $ref: '#/components/schemas/User' })).toBe('User')
    expect(renderSchemaType({ type: 'integer' })).toBe('number')
    expect(renderSchemaType({ items: { type: 'string' }, type: 'array' })).toBe('string[]')
    expect(renderSchemaType({ enum: ['A', 'B'], type: 'string' })).toBe('"A" | "B"')
    expect(renderSchemaType({ nullable: true, type: 'string' })).toBe('string | null')
  })

  it('renders object properties with required flags and descriptions', () => {
    expect(renderSchemaType({
      properties: {
        id: {
          description: 'User id',
          type: 'number',
        },
        'display-name': {
          type: 'string',
        },
      },
      required: ['id'],
      type: 'object',
    })).toBe(`{
  "display-name"?: string
  /**
   * User id
   */
  id: number
}`)
  })

  it('renders additional properties and unsupported schemas conservatively', () => {
    expect(renderSchemaType({
      additionalProperties: { type: 'string' },
      type: 'object',
    })).toBe('Record<string, string>')
    expect(renderSchemaType({})).toBe('unknown')
  })
})

describe('renderObjectType', () => {
  it('renders empty object types', () => {
    expect(renderObjectType([])).toBe('{}')
  })
})

describe('renderComponentSchemas', () => {
  it('renders sorted exported component type aliases', () => {
    expect(renderComponentSchemas({
      User: {
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
        type: 'object',
      },
      Empty: {
        type: 'object',
      },
    })).toBe(`export type Empty = {}

export type User = {
  id: number
}`)
  })
})

describe('identifier helpers', () => {
  it('quotes invalid property names and normalizes type names', () => {
    expect(renderPropertyName('x-request-id')).toBe('"x-request-id"')
    expect(renderPropertyName('validName')).toBe('validName')
    expect(toTypeName('repository-info response')).toBe('repositoryInfoResponse')
    expect(toTypeName('123')).toBe('GeneratedType')
  })
})
