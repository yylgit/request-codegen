import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const GENERATED_MARKER = 'automatically generated'

export async function writeGeneratedFile(filePath: string, contents: string) {
  await assertCanWrite(filePath)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, contents, 'utf8')
}

async function assertCanWrite(filePath: string) {
  const existing = await readExistingFile(filePath)

  if (existing === undefined || isGeneratedFile(existing)) {
    return
  }

  throw new Error(`Refusing to overwrite non-generated file: ${filePath}`)
}

async function readExistingFile(filePath: string) {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined
    }

    throw error
  }
}

function isGeneratedFile(contents: string) {
  return contents.slice(0, 500).includes(GENERATED_MARKER)
}

function isNotFoundError(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
