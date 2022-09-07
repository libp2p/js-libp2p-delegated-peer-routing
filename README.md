# @libp2p/delegated-peer-routing <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![IRC](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-delegated-peer-routing.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-delegated-peer-routing)
[![CI](https://img.shields.io/github/workflow/status/libp2p/js-libp2p-interfaces/test%20&%20maybe%20release/master?style=flat-square)](https://github.com/libp2p/js-libp2p-delegated-peer-routing/actions/workflows/js-test-and-release.yml)

> Leverage other peers in the libp2p network to perform Peer Routing calls.

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Requirements](#requirements)
- [Example](#example)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i @libp2p/delegated-peer-routing
```

Leverage other peers in the network to perform Peer Routing calls.

Requires access to `/api/v0/dht/findpeer` and `/api/v0/dht/query` HTTP API endpoints of the delegate node.

## Requirements

`libp2p-delegated-peer-routing` leverages the `ipfs-http-client` library and requires an instance of it as a constructor argument.

```sh
npm install ipfs-http-client libp2p-delegated-peer-routing
```

## Example

```js
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { DelegatedPeerRouting } from '@libp2p/delegated-peer-routing')
import { create as createIpfsHttpClient } from 'ipfs-http-client')

// default is to use ipfs.io
const routing = new DelegatedPeerRouting(createIpfsHttpClient({
  // use default api settings
  protocol: 'https',
  port: 443,
  host: 'node0.delegate.ipfs.io'
}))

try {
  for await (const event of routing.findPeer('peerid')) {
    console.log('query event', event)
  }
} catch (err) {
  console.error(err)
}

const peerId = await createEd25519PeerId()
for await (const event of routing.getClosestPeers(peerId.id)) {
  console.log('query event', event)
}
```

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
