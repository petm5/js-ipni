import { CID } from 'multiformats'
import { sha256 } from 'multiformats/hashes/sha2'
import { RecordEnvelope } from '@libp2p/peer-record'
import * as Block from 'multiformats/block'
import type { BlockView } from 'multiformats/block/interface'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'
import type { PrivateKey } from '@libp2p/interface'
import { publicKeyToProtobuf } from '@libp2p/crypto/keys'
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

export interface HeadParams {
  headCid: CID,
  topic?: string,
  privateKey: PrivateKey,
}

export class AdvertisementHead {
  constructor(private parameters: HeadParams) {}

  async encodeAndSign() {
    const { headCid, topic, privateKey } = this.parameters

    // Canonical head serialization - https://github.com/ipni/specs/blob/main/IPNI_HTTP_PROVIDER.md#response
    const serializedHead = new Uint8Array([
      ...headCid.bytes,
      ...topic ? new TextEncoder().encode(topic) : []
    ])
    const serializedHeadDigest = (await sha256.digest(serializedHead)).bytes

    const record = {
      codec: AD_SIG_CODEC,
      domain: 'indexer',
      marshal: () => serializedHeadDigest,
      equals: () => false
    }

    const signature = (await RecordEnvelope.seal(record, privateKey)).marshal().subarray()

    // SignedHead schema - https://github.com/ipni/specs/blob/main/IPNI_HTTP_PROVIDER.md#response
    return {
      head: headCid,
      ...(topic ? { topic } : {}),
      pubkey: publicKeyToProtobuf(privateKey.publicKey),
      sig: signature
    }
  }

  async export(): Promise<BlockView> {
    const signedHead = await this.encodeAndSign()
    // Head only supports DAG-JSON - https://github.com/ipni/go-libipni/blob/91107b948b1ed8c8680a3eab098fcc9f79ab469a/dagsync/ipnisync/head/signedhead.go#L47
    return await Block.encode({ value: signedHead, codec: dagJson, hasher: sha256 })
  }
}
