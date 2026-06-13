import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { writeGeneratedFile } from './write-file.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.map((directory) => rm(directory, {
    force: true,
    recursive: true,
  })))
  tempDirs.length = 0
})

describe('writeGeneratedFile', () => {
  it('creates parent directories and writes files', async () => {
    const cwd = await createTempDir()
    const filePath = join(cwd, 'nested', 'models.ts')

    await writeGeneratedFile(filePath, '/* automatically generated */')

    await expect(readFile(filePath, 'utf8')).resolves.toBe('/* automatically generated */')
  })

  it('allows generated files to be overwritten', async () => {
    const cwd = await createTempDir()
    const filePath = join(cwd, 'models.ts')
    await writeFile(filePath, '/* automatically generated */ old', 'utf8')

    await writeGeneratedFile(filePath, '/* automatically generated */ new')

    await expect(readFile(filePath, 'utf8')).resolves.toBe('/* automatically generated */ new')
  })

  it('refuses to overwrite non-generated files', async () => {
    const cwd = await createTempDir()
    const filePath = join(cwd, 'models.ts')
    await writeFile(filePath, 'hand written', 'utf8')

    await expect(writeGeneratedFile(filePath, '/* automatically generated */')).rejects.toThrow(
      'Refusing to overwrite non-generated file',
    )
  })
})

async function createTempDir() {
  const directory = await mkdtemp(join(tmpdir(), 'request-codegen-'))
  tempDirs.push(directory)

  return directory
}
