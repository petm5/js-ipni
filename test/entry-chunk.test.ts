import { expect, test } from 'vitest'
import { EntryChunk } from '../src/entry-chunk.js'

test('encodeEntryChunk', async () => {
  const entries = new EntryChunk()
  const encoded = await entries.export()
  expect(encoded).toBeTruthy()
})
