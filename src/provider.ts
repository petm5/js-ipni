import varint from 'varint'
import type { PrivateKey } from '@libp2p/interface'

/**
* Entries are provided by a Trustless Gateway
* @see https://github.com/ipni/specs/blob/main/IPNI.md#metadata
* @see https://github.com/multiformats/go-multicodec/blob/f57c73871939a0d533597e1dae416dae92533fb6/code_table.go#L459-L460
*/
export const TRUSTLESS_GATEWAY_PREFIX = new Uint8Array(varint.encode(0x0920))

/**
* Entries are provided by an IPNS record
* Must be followed by the serialized record
* @see https://github.com/multiformats/go-multicodec/blob/f57c73871939a0d533597e1dae416dae92533fb6/code_table.go#L435-L436
*/
export const IPNS_RECORD_PREFIX = new Uint8Array(varint.encode(0x0300))

export enum Protocol {
  TrustlessGateway,
  IpnsRecord,
}

/** Defines the peer that provides the entries */
export class Provider {
  constructor(
    public privateKey: PrivateKey,
    public addresses: Array<string>,
    public protocol: Protocol,
    public metadata?: Uint8Array,
  ) {}
  encodeMetadata(): Uint8Array {
    switch (this.protocol) {
      case Protocol.TrustlessGateway:
        return new Uint8Array([...TRUSTLESS_GATEWAY_PREFIX])
      case Protocol.IpnsRecord:
        if (!this.metadata) throw new Error('metadata required')
        /** @see https://github.com/ipni/specs/blob/main/IPNI.md#metadata
          * @see https://github.com/ipni/go-naam/blob/7319ed2cbb9d46eb560e6423ccd9d9a97874f826/naam.go#L425-L434 */
        return new Uint8Array([
          ...IPNS_RECORD_PREFIX,
          ...varint.encode(this.metadata.length),
          ...this.metadata
        ])
    }
  }
}
