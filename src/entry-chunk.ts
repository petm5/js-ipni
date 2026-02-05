import { CID } from 'multiformats'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'

export const CID_SIZE_BYTES = 36

// libp2p doesn't like blocks over 1MB
export const CHUNK_THRESHOLD = 1_048_576

export class EntryChunk {
  next?: CID
  entries: Array<Uint8Array> = []
  constructor(next?: CID) {
    this.next = next
  }
  add(entry: Uint8Array) {
    this.entries.push(entry)
  }
  estimateSize() {
    // assume 1K overhead just to be safe
    return this.entries.length * CID_SIZE_BYTES + 1024
  }
  async export() {
    // IPNI EntryChunk - https://github.com/ipni/specs/blob/main/IPNI.md#entrychunk-chain
    const value = {
      Entries: this.entries,
      ...(this.next ? { Next: this.next } : {})
    }
    return await Block.encode({ value, codec: dagCbor, hasher: sha256 })
  }
}
