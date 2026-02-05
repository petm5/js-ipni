import { expect, test } from 'vitest'
import { CID } from 'multiformats'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import varint from 'varint'
import { Provider, Protocol, TRUSTLESS_GATEWAY_PREFIX } from '../src/provider'
import { Advertisement } from '../src/advertisement'
// import CBOR from 'cbor-js'

test('trustless gateway provider', async () => {
  const privKey = await generateKeyPair('Ed25519')
  const peerId = peerIdFromPrivateKey(privKey)
  const addresses = ['/dns4/example.com/tcp/443/https']
  const entryCid = CID.parse('bafkreibm6jg3ux5qumhcn2b3flc3tyu6dmlb4xa7u5bf44yegnrjhc4yeq')
  const context = new TextEncoder().encode('/ipfs/test')
  const provider = new Provider(privKey, addresses, Protocol.TrustlessGateway)
  const advertisement = new Advertisement(peerId.toString(), entryCid, provider, context)
  const encoded = await advertisement.encodeAndSign()
  expect(encoded).toMatchObject({
    Provider: peerId.toString(),
    Addresses: addresses,
    Entries: entryCid,
    ContextID: context,
    Metadata: new Uint8Array([...TRUSTLESS_GATEWAY_PREFIX]),
    IsRm: false
  })
  expect(encoded.PreviousID, 'PreviousID is not set').toBeFalsy()
})
