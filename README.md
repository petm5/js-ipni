# js-ipni

Create signed [Advertisement](https://github.com/ipni/specs/blob/main/IPNI.md#advertisements) records for the [InterPlanetary Network Indexer (IPNI)](https://docs.ipfs.tech/concepts/ipni/)

This library implements the Advertisement and EntryChunk chain structs according to the IPNI spec and its implementation in [`go-libipni`](https://github.com/ipni/go-libipni).

HAMT entry records (used for efficiency when publishing very large datasets) are not implemented in this library, but they could be generated externally and passed into an Advertisement in place of the standard Entry chain. Use something like [`js-ipld-hashmap`](https://github.com/rvagg/js-ipld-hashmap) following the [IPNI HAMT spec](https://github.com/rvagg/js-ipld-hashmap) if you want to generate them.

Extended providers are not currently supported.

Sharing advertisement records with indexers is considered out of scope. If you want to do that, please follow the [Advertisement Transfer spec](https://github.com/ipni/specs/blob/main/IPNI.md#advertisement-transfer).

## Usage

todo, see tests and [generate-ipni.ts](https://github.com/petm5/petermarshall.ca-v2/blob/97edcecee328a6c191d3b765b348ff729a5d5a00/scripts/generate-ipni.ts)

### Supported Provider Protocols

* [Trustless Gateway](http://specs.ipfs.tech.ipns.localhost:8080/http-gateways/trustless-gateway/) - Provide CIDs using a HTTP endpoint
* [IPNS Record (Naam)](https://github.com/ipni/specs/pull/4) - Provide an IPNS record and specify the peers that provide its contents for reverse lookup

## Credits

Based on the following reference implementations:

- [ipni/go-libipni/ingest/schema/envelope.go](https://github.com/ipni/go-libipni/blob/main/ingest/schema/envelope.go)
- [multiformats/go-multicodec/code_table.go](https://github.com/multiformats/go-multicodec/blob/main/code_table.go)
- [ipni/go-naam](https://github.com/ipni/go-naam/)
- [storacha/ipni](https://github.com/storacha/ipni)
