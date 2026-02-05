import { CID } from 'multiformats'
import { sha256 } from 'multiformats/hashes/sha2'
import { RecordEnvelope } from '@libp2p/peer-record'
import * as Block from 'multiformats/block'
import type { BlockView } from 'multiformats/block/interface'
import * as dagCbor from '@ipld/dag-cbor'
import { Provider } from './provider.js'

// https://github.com/ipni/go-libipni/blob/afe2d8ea45b86c2a22f756ee521741c8f99675e5/ingest/schema/envelope.go#L20-L22
const AD_SIG_CODEC = new TextEncoder().encode('/indexer/ingest/adSignature')

export interface AdvertisementParams {
  peerId: string,
  entryCid: CID,
  provider: Provider,
  context: Uint8Array,
  prevCid?: CID,
  isRm?: false,
}

export class Advertisement {
  constructor(private parameters: AdvertisementParams) {}

  async encodeAndSign() {
    const { peerId, prevCid, entryCid, provider, context, isRm } = this.parameters

    const metadata = provider.encodeMetadata()

    // Canonical data payload serialization - https://github.com/ipni/go-libipni/blob/afe2d8ea45b86c2a22f756ee521741c8f99675e5/ingest/schema/envelope.go#L84
    const serializedAd = new Uint8Array([
      ...prevCid?.bytes ?? new Uint8Array([]),
      ...entryCid.bytes,
      ...new TextEncoder().encode(peerId),
      ...new TextEncoder().encode(provider.addresses.map(a => a.toString()).join('')),
      ...metadata,
      isRm ? 1 : 0 // IsRm field is always false
    ])
    const serializedAdDigest = (await sha256.digest(serializedAd)).bytes

    const record = {
      codec: AD_SIG_CODEC,
      domain: 'indexer',
      marshal: () => serializedAdDigest,
      equals: () => false
    }

    const signature = (await RecordEnvelope.seal(record, provider.privateKey)).marshal().subarray()

    // IPNI Advertisement - https://github.com/ipni/specs/blob/main/IPNI.md#advertisements
    return {
      ...(prevCid ? { PreviousID: prevCid } : {}),
      Provider: peerId,
      Addresses: provider.addresses,
      Entries: entryCid,
      ContextID: context,
      Metadata: metadata,
      IsRm: !!isRm,
      Signature: signature,
    }
  }

  async export(): Promise<BlockView> {
    const signedAd = await this.encodeAndSign()
    return await Block.encode({ value: signedAd, codec: dagCbor, hasher: sha256 })
  }
}
